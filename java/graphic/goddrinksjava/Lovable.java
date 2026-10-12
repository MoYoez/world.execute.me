package goddrinksjava;

/** Original implementation, with object names honoring Mili's Java narrative. */
final class Lovable extends Thing {
    Lovable(String name) {
        super(name); Trace.emit(name.equals("Me") ? "create" : "presence");
    }
    Lovable(Thing previous) { super(previous, "scope"); }
}

final class PointSet extends Thing { PointSet(Thing from) { super(from, "points"); } }
final class Circle extends Thing { Circle(Thing from) { super(from, "circle"); } }
final class SineWave extends Thing { SineWave(Thing from) { super(from, "wave"); } }
final class Sequence extends Thing { Sequence(Thing from) { super(from, "infinity"); } }
final class Eggplant extends Thing { Eggplant(Thing from) { super(from, "eggplant"); } }
final class Tomato extends Thing { Tomato(Thing from) { super(from, "tomato"); } }
final class TabbyCat extends Thing { TabbyCat(Thing from) { super(from, "cat"); } }
final class God extends Thing { God(Thing from) { super(from, "world"); } }
