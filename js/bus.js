const CHANNEL = (id) => `nl:${id}`;

export function createBus({ sessionId, supabaseUrl, supabaseAnon, role, onEvent, onPresence }) {
  const seen = new Set();
  const local = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL(sessionId)) : null;
  let lastId = 0;
  let sb = null;
  let pollTimer = 0;

  function emit(evt) {
    const key = evt._id || `${evt.type}:${evt.t}:${JSON.stringify(evt.payload || {})}`;
    if (seen.has(key)) return;
    seen.add(key);
    onEvent?.(evt);
  }

  if (local) {
    local.onmessage = (e) => emit(e.data);
  }

  async function attachSupabase() {
    if (!supabaseUrl || !supabaseAnon || !window.supabase) return;
    sb = window.supabase.createClient(supabaseUrl, supabaseAnon);
    const room = sb.channel(CHANNEL(sessionId), {
      config: { broadcast: { self: false }, presence: { key: role } },
    });
    room.on("broadcast", { event: "nl" }, ({ payload }) => emit(payload));
    room.on("postgres_changes", { event: "INSERT", schema: "public", table: "nl_events", filter: `session_id=eq.${sessionId}` }, (row) => {
      const rec = row.new || {};
      lastId = Math.max(lastId, Number(rec.id || 0));
      emit({ type: rec.type, payload: rec.payload, t: Date.parse(rec.created_at) || Date.now(), _id: `db:${rec.id}` });
    });
    room.on("presence", { event: "sync" }, () => {
      const state = room.presenceState();
      onPresence?.(state);
    });
    await room.subscribe(async (status) => {
      if (status === "SUBSCRIBED") await room.track({ role, at: Date.now() });
    });
    createBus._room = room;
    createBus._sb = sb;
    const { data } = await sb.from("nl_events").select("id,type,payload,created_at").eq("session_id", sessionId).order("id", { ascending: true }).limit(50);
    (data || []).forEach((rec) => {
      lastId = Math.max(lastId, Number(rec.id || 0));
      emit({ type: rec.type, payload: rec.payload, t: Date.parse(rec.created_at) || Date.now(), _id: `db:${rec.id}` });
    });
    pollTimer = window.setInterval(async () => {
      const { data: more } = await sb.from("nl_events").select("id,type,payload,created_at").eq("session_id", sessionId).gt("id", lastId).order("id", { ascending: true });
      (more || []).forEach((rec) => {
        lastId = Math.max(lastId, Number(rec.id || 0));
        emit({ type: rec.type, payload: rec.payload, t: Date.parse(rec.created_at) || Date.now(), _id: `db:${rec.id}` });
      });
    }, 800);
  }

  async function send(type, payload = {}) {
    const evt = { type, payload, t: Date.now(), from: role };
    local?.postMessage(evt);
    createBus._room?.send({ type: "broadcast", event: "nl", payload: evt });
    if (sb) {
      await sb.from("nl_events").insert({ session_id: sessionId, type, payload });
    }
  }

  return {
    send,
    ready: attachSupabase(),
    close() {
      local?.close();
      window.clearInterval(pollTimer);
      createBus._room?.unsubscribe();
    },
  };
}
