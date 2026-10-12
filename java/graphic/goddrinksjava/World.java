package goddrinksjava;

import java.util.*;

final class World {
    final int seed;
    final Set<Integer> peers = new LinkedHashSet<>();
    boolean powered, running;
    String era = "AD";
    World(int seed) { this.seed = seed; Trace.emit("world"); }
    void power(boolean value) { powered = value; Trace.emit("power", value); }
    void startSimulation() {
        if (!powered) throw new IllegalStateException("No power");
        running = true; Trace.emit("run");
    }
    void timeTravel(String era) {
        if (!Set.of("AD", "BC").contains(era)) throw new IllegalArgumentException(era);
        this.era = era; Trace.emit("era", era);
    }
    void spawn(int count) {
        peers.clear(); for (int i = 0; i < count; i++) peers.add(i);
        Trace.emit("spawn", count);
    }
    void runExecution(int id) {
        if (!peers.remove(id)) throw new IllegalArgumentException("Missing peer: " + id);
        Trace.emit("remove", id);
    }
    void runExecution() { running = true; Trace.emit("execute"); }
    void clear() { peers.clear(); Trace.emit("clear"); }
    void execute(Thing thing) { Objects.requireNonNull(thing); running = false; Trace.emit("terminate"); }
}
