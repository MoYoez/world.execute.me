package goddrinksjava;

import java.util.*;

/** Virtual-clock execution: the web player renders these timestamped events. */
final class Trace {
    static final List<Map<String, Object>> events = new ArrayList<>();
    static final Map<String, Map<String, Object>> commands = new LinkedHashMap<>();
    static int cursor;
    static String row;
    static Map<String, Object> command;
    static boolean recording;

    static void start() {
        events.clear(); commands.clear(); cursor = 0; recording = true;
    }

    static void emit(String kind) { emit(kind, null); }
    static void emit(String kind, Object value) {
        command = new LinkedHashMap<>();
        command.put("kind", kind);
        if (value != null) command.put("value", value);
        if (recording) record();
    }
    static void bind(boolean present) {
        emit("bind"); command.put("value", present ? "you" : null);
    }
    static void fit(int width, int height) {
        emit("fit"); command.put("width", width); command.put("height", height);
    }
    private static void record() {
        if (cursor >= Score.IDS.length) throw new IllegalStateException("Extra command");
        int index = cursor++;
        row = Score.IDS[index];
        commands.put(Score.SOURCES[index], command);
        var event = new LinkedHashMap<String, Object>();
        event.put("row", row); event.put("at", Score.TIMES[index]);
        event.put("source", Score.SOURCES[index]); event.put("command", command);
        events.add(event);
    }
    static void probe(String source, Runnable action) {
        boolean previous = recording;
        recording = false; row = "source-revision"; command = null;
        try { action.run(); } finally { recording = previous; }
        if (command == null) throw new IllegalStateException(source);
        commands.put(source, command);
    }
    static void verifyEdits(Thing me, Thing you) {
        probe("me.bind(you);", () -> me.setProof(you));
        probe("me.bind(null);", () -> me.setProof(null));
        probe("me.lock(false);", () -> me.lock(false));
        probe("me.lock(true);", () -> me.lock(true));
        probe("me.retain();", () -> me.retain());
        probe("me.amplitude(1.8);", () -> me.amplitude(1.8));
        probe("me.limit(6);", () -> me.limit(6));
    }
    static String json(Object value) {
        if (value == null) return "null";
        if (value instanceof String text) return "\"" + text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r") + "\"";
        if (value instanceof Map<?, ?> map) {
            var entries = new ArrayList<String>();
            map.forEach((key, item) -> entries.add(json(key.toString()) + ":" + json(item)));
            return "{" + String.join(",", entries) + "}";
        }
        if (value instanceof Iterable<?> items) {
            var entries = new ArrayList<String>();
            items.forEach(item -> entries.add(json(item)));
            return "[" + String.join(",", entries) + "]";
        }
        return value.toString();
    }
    static void write() {
        if (cursor != Score.IDS.length) throw new IllegalStateException("Incomplete performance");
        System.out.println(json(Map.of("events", events, "commands", commands)));
    }
}
