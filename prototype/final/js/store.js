// Final Pass — 本地事务层（不是后端）
// 目标：让报名真正进入名单、让审核/分车/签到/到家/阶段推进带不变量校验，
// 并在详情与协作之间共享同一份会话状态。刷新页面会回到初始演示快照。
import { FEATURED, VEHICLES, NOW, scenario } from './data.js';

const VIEWER_ID = 'viewer';
const ok = (extra = {}) => ({ ok: true, ...extra });
const err = (message) => ({ ok: false, error: message });

export function createStore() {
  const state = {
    approved: new Set(),
    assigned: new Map(),
    checked: new Set(),
    boarded: new Set(),
    home: new Set(),
    departed: new Set(),
    rejected: new Set(),
    incidentResolved: false,
    closingReason: '',
    viewerSignup: null,
    log: []
  };

  const sc = (stage) => scenario(stage, state);
  const find = (stage, id) => sc(stage).roster.find((m) => m.id === id);
  const log = (action, detail) => state.log.push({ at: new Date().toISOString(), action, detail });
  const nextStage = { published: 'gathering', gathering: 'active', active: 'closing', closing: 'archived' };

  const actions = {
    signupSubmit(payload, stage = 'published') {
      if (stage !== 'published') return err('报名只在行前准备阶段开放。');
      if (new Date(FEATURED.deadlineAt) <= NOW) return err('报名已截止，不能再提交新报名。');
      if (state.viewerSignup && ['pending', 'confirmed', 'waitlisted'].includes(state.viewerSignup.audit)) {
        return err('你已经提交过报名，请查看我的报名。');
      }
      const current = sc(stage);
      if (current.remaining <= 0) return err('名额已满；当前演示不支持候补提交。');
      const automatic = FEATURED.approvalMode === 'automatic';
      state.viewerSignup = {
        id: VIEWER_ID,
        name: payload.name,
        role: '成员',
        audit: automatic ? 'confirmed' : 'pending',
        trip: payload.transport === 'self' ? 'self' : 'shared',
        pickup: payload.pickup || 'p1',
        vehicleId: null,
        seatNo: null,
        requestedAt: '刚刚',
        submittedAt: '刚刚',
        phone: payload.phone ? String(payload.phone).replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : ''
      };
      log('signup.submit', `${payload.name} → ${state.viewerSignup.audit}`);
      return ok({ status: state.viewerSignup.audit });
    },

    signupUpdate(payload, stage = 'published') {
      const v = state.viewerSignup;
      if (!v || !['pending', 'confirmed'].includes(v.audit)) return err('当前没有可修改的报名。');
      if (stage !== 'published') return err('出发后不能修改报名资料。');
      const pickupChanged = payload.pickup && payload.pickup !== v.pickup;
      v.name = payload.name || v.name;
      v.trip = payload.transport === 'self' ? 'self' : 'shared';
      if (pickupChanged) {
        v.pickup = payload.pickup;
        v.vehicleId = null;
        v.seatNo = null;
      }
      log('signup.update', v.name);
      return ok({ status: v.audit });
    },

    signupCancel(stage = 'published') {
      const v = state.viewerSignup;
      if (!v || !['pending', 'confirmed', 'waitlisted'].includes(v.audit)) return err('当前没有可取消的报名。');
      if (!['published', 'gathering'].includes(stage)) return err('进入同行后不能取消报名。');
      if (state.checked.has(VIEWER_ID) || state.boarded.has(VIEWER_ID) || state.home.has(VIEWER_ID)) {
        return err('已经产生签到/上车/到家事实，不能在线取消。');
      }
      v.audit = 'cancelled';
      log('signup.cancel', v.name);
      return ok();
    },

    audit(memberId, decision, stage = 'published') {
      if (stage !== 'published') return err('审核只在行前准备阶段开放。');
      const m = find(stage, memberId);
      if (!m) return err('找不到该报名记录。');
      if (m.audit !== 'pending') return err('只有待审核报名可以审核。');
      if (memberId === VIEWER_ID) {
        state.viewerSignup.audit = decision === 'approve' ? 'confirmed' : 'rejected';
      } else if (decision === 'approve') {
        state.approved.add(memberId);
      } else {
        state.rejected.add(memberId);
      }
      log(`signup.audit.${decision}`, m.name);
      return ok();
    },

    assign(memberId, vehicleId, seatNo, stage = 'published') {
      if (!['published', 'gathering'].includes(stage)) return err('当前阶段不能改分车。');
      const m = find(stage, memberId);
      if (!m) return err('找不到该成员。');
      if (m.audit !== 'confirmed') return err('只有已确认成员可以分车。');
      if (m.trip !== 'shared') return err('自行前往成员不进入车辆。');
      const v = VEHICLES.find((x) => x.id === vehicleId);
      if (!v) return err('车辆不存在。');
      if (!Array.isArray(v.pickup) || !v.pickup.includes(m.pickup)) return err('该车辆不覆盖此成员的上车点。');
      const seat = String(seatNo);
      if (!/^\d{2}$/.test(seat) || Number(seat) < 1 || Number(seat) > v.passengerSeats) return err('座位号不在核载范围内。');
      const used = new Set(sc(stage).roster
        .filter((x) => x.id !== memberId && x.vehicleId === vehicleId && x.seatNo !== 'driver')
        .map((x) => String(x.seatNo)));
      if (used.has(seat)) return err('该座位已被占用。');
      if (state.departed.has(vehicleId)) return err('该车已发车，不能再改座位。');
      if (memberId === VIEWER_ID) {
        state.viewerSignup.vehicleId = vehicleId;
        state.viewerSignup.seatNo = seat;
      } else {
        state.assigned.set(memberId, { vehicleId, seatNo: seat });
      }
      log('transport.assign', `${m.name} → ${v.label} ${seat}`);
      return ok();
    },

    checkin(memberId, stage = 'gathering') {
      if (stage !== 'gathering') return err('签到只在集合阶段开放。');
      const m = find(stage, memberId);
      if (!m || m.audit !== 'confirmed') return err('只有已确认成员可以签到。');
      if (state.checked.has(memberId)) return err('该成员已经签到。');
      state.checked.add(memberId);
      log('attendance.checkin', m.name);
      return ok();
    },

    board(memberId, vehicleId, stage = 'gathering') {
      if (stage !== 'gathering') return err('上车确认只在集合阶段开放。');
      const m = find(stage, memberId);
      if (!m || m.audit !== 'confirmed') return err('只有已确认成员可以上车。');
      if (m.vehicleId !== vehicleId) return err('该成员不在本车。');
      if (!m.checked) return err('未签到成员不能确认上车。');
      if (state.departed.has(vehicleId)) return err('本车已发车，不能再改上车状态。');
      if (m.boarded) return err('该成员已经确认上车。');
      state.boarded.add(memberId);
      log('transport.board', `${m.name} → ${vehicleId}`);
      return ok();
    },

    depart(vehicleId, stage = 'gathering') {
      if (stage !== 'gathering') return err('发车只在集合阶段开放。');
      if (state.departed.has(vehicleId)) return err('本车已经发车。');
      const s = sc(stage);
      const passengers = s.roster.filter((m) => m.audit === 'confirmed' && m.vehicleId === vehicleId && m.seatNo !== 'driver');
      const gaps = passengers.filter((m) => !m.boarded).length;
      state.departed.add(vehicleId);
      log('transport.depart', `${vehicleId} gaps=${gaps}`);
      return ok({ gaps });
    },

    home(memberId, note, authorized, stage = 'closing') {
      if (stage !== 'closing') return err('到家确认只在返程阶段开放。');
      const m = find(stage, memberId);
      if (!m || m.audit !== 'confirmed') return err('只有已确认成员可以确认到家。');
      if (m.departed !== 'joined') return err('未随队出发的成员不能代确认到家。');
      if (!String(note || '').trim()) return err('请填写确认依据。');
      if (!authorized) return err('需要确认已获得本人授权。');
      if (state.home.has(memberId)) return err('该成员已经确认到家。');
      state.home.add(memberId);
      log('attendance.home', m.name);
      return ok();
    },

    resolveIncident(note, stage = 'active') {
      if (!['active', 'closing'].includes(stage)) return err('当前阶段没有可处理的异常。');
      if (state.incidentResolved) return err('异常已经处理。');
      if (!String(note || '').trim()) return err('请填写处理结果。');
      state.incidentResolved = true;
      log('incident.resolve', String(note).slice(0, 80));
      return ok();
    },

    advance(target, stage = 'published') {
      if (nextStage[stage] !== target) return err('不能跳阶段或回退。');
      const s = sc(stage);
      if (target === 'gathering' && s.pending > 0) return err(`仍有 ${s.pending} 人待审核，不能进入集合阶段。`);
      if (target === 'active') {
        if (s.unchecked > 0) return err(`仍有 ${s.unchecked} 人未签到。`);
        if (s.unassigned > 0) return err(`仍有 ${s.unassigned} 人未分车。`);
        if (s.incident) return err('仍有未解决异常。');
      }
      if (target === 'closing' && s.incident) return err('仍有未解决异常。');
      if (target === 'archived') {
        if (s.homePending > 0) return err(`仍有 ${s.homePending} 人未确认到家。`);
        if (s.incident) return err('仍有未解决异常。');
      }
      log('activity.advance', `${stage} → ${target}`);
      return ok();
    },

    reset() {
      for (const key of ['approved', 'checked', 'boarded', 'home', 'departed', 'rejected']) state[key].clear();
      state.assigned.clear();
      state.incidentResolved = false;
      state.closingReason = '';
      state.viewerSignup = null;
      state.log = [];
    },

    clearViewer() {
      state.viewerSignup = null;
    }
  };

  return Object.assign(state, { actions });
}
