package goddrinksjava;

import java.util.*;

/** A persistent identity whose shape can change without losing its memories. */
abstract class Thing {
    enum Value { AC, DC, F, M, S, AM, PM, NUTRIENTS, ANTIOXIDANTS }
    static final class State {
        final String name;
        int width = 640, height = 470, limit = 1;
        double amplitude = 1;
        boolean locked, visible = true;
        Thing proof;
        Value current = Value.DC, gender = Value.F, role = Value.M, period = Value.AM;
        final List<String> memories = new ArrayList<>();
        final Set<String> knowledge = new HashSet<>();
        State(String name) { this.name = name; }
    }
    final State state;
    Thing(String name) { state = new State(name); }
    Thing(Thing previous, String form) {
        state = previous.state; Trace.emit("shape", form);
    }
    void fit(int width, int height) {
        if (width <= 0 || height <= 0) throw new IllegalArgumentException("Dimensions");
        state.width = width; state.height = height; Trace.fit(width, height);
    }
    void lock(boolean value) { state.locked = value; Trace.emit("lock", value); }
    void setProof(Thing you) { state.proof = you; Trace.bind(you != null); }
    void amplitude(double value) { state.amplitude = value; Trace.emit("amplitude", value); }
    void limit(int value) { state.limit = value; Trace.emit("limit", value); }
    void current(Value value) { state.current = value; Trace.emit("current", value.name()); }
    void canSee(boolean value) { state.visible = value; Trace.emit("visible", value); }
    void gender(Value value) { state.gender = value; Trace.emit("gender", value.name()); }
    void role(Value value) { state.role = value; Trace.emit("role", value == Value.S ? 1 : -1); }
    void time(Value value) { state.period = value; Trace.emit("time", value.name()); }
    void release() { state.locked = false; state.memories.clear(); Trace.emit("release"); }
    void retain() { state.memories.add(Trace.row); Trace.emit("retain"); }
    void learnTopic(String topic) { state.knowledge.add(topic); lock(false); }
    void takeExamTopic(String topic) {
        if (!state.knowledge.contains(topic)) throw new IllegalArgumentException("Unknown topic");
        release();
    }
    void giveDimensions(Thing you) {
        if (!(this instanceof PointSet) || you == null) throw new IllegalStateException("Point set");
        amplitude(2);
    }
    void giveCircumference(Thing you) {
        if (!(this instanceof Circle) || you == null) throw new IllegalStateException("Circle");
        fit(420, 420);
    }
    void offerTangents(Thing you) {
        if (!(this instanceof SineWave) || you == null) throw new IllegalStateException("Sine wave");
        amplitude(1.4);
    }
    void limitBy(Thing you) { Objects.requireNonNull(you); limit(1); }
    void giveNutrients(Thing you) {
        if (!(this instanceof Eggplant)) throw new IllegalStateException("Eggplant");
        Objects.requireNonNull(you); Trace.emit("offer", "NUTRIENTS");
    }
    void giveAntioxidants(Thing you) {
        if (!(this instanceof Tomato)) throw new IllegalStateException("Tomato");
        Objects.requireNonNull(you); Trace.emit("offer", "ANTIOXIDANTS");
    }
    void purr(Thing you) {
        if (!(this instanceof TabbyCat)) throw new IllegalStateException("Cat");
        Objects.requireNonNull(you); state.current = Value.AC; Trace.emit("purr");
    }
}
