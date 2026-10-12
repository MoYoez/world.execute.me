package goddrinksjava;

import static goddrinksjava.Thing.Value.*;

// An original performance in homage to Mili.
public final class GodDrinksJava {
    private World world;
    private Thing me, you;

    public static void main(String[] args) {
        Trace.start();
        new GodDrinksJava().perform();
        Trace.write();
    }

    private void perform() {
        createOurWorld();
        offerMyDimensions();
        changeWithYou();
        makeYouHappy();
        becomeWhatYouNeed();
        changeMyIdentity();
        holdOnToYou();
        searchForYou();
        rejectTheWorld();
        eraseEverythingElse();
        bringYouBack();
        learnToLove();
        Trace.verifyEdits(me, you);
    }

    private void createOurWorld() {
        world = new World(5);
        world.power(true);
        me = new Lovable("Me");
        me.fit(520, 420);
        me.lock(false);
        you = new Lovable("You");
        me.setProof(you);
        world.startSimulation();
        me.fit(640, 470);
        me.fit(520, 420);
        me.setProof(you);
    }

    private void offerMyDimensions() {
        me = new PointSet(me);
        if (me instanceof PointSet) {
            me.giveDimensions(you);
        }
        me = new Circle(me);
        if (me instanceof Circle) {
            me.giveCircumference(you);
        }
        me = new SineWave(me);
        if (me instanceof SineWave) {
            me.offerTangents(you);
        }
        me = new Sequence(me);
        if (me instanceof Sequence) {
            me.limitBy(you);
        }
    }

    private void changeWithYou() {
        me.current(AC);
        me.current(DC);
        me.canSee(false);
        me.canSee(true);
        world.timeTravel("AD");
        world.timeTravel("BC");
        me.setProof(you);
        me = new Lovable(me);
    }

    private void makeYouHappy() {
        me.amplitude(2);
        me.fit(570, 480);
        me.lock(true);
        me.lock(false);
        me.setProof(you);
        world.runExecution();
        me.fit(400, 450);
    }

    private void becomeWhatYouNeed() {
        me = new Eggplant(me);
        if (me instanceof Eggplant) {
            me.giveNutrients(you);
        }
        me = new Tomato(me);
        me.amplitude(1);
        if (me instanceof Tomato) {
            me.giveAntioxidants(you);
        }
        me = new TabbyCat(me);
        if (me instanceof TabbyCat) {
            me.purr(you);
        }
        me = new God(me);
        me.setProof(you);
    }

    private void changeMyIdentity() {
        me.gender(F);
        me.gender(M);
        me.time(AM);
        me.time(PM);
        me.role(S);
        me.role(M);
        me = new Lovable(me);
    }

    private void holdOnToYou() {
        me.setProof(you);
        me.fit(284, 396);
        me.lock(true);
        me.amplitude(2.4);
        me.lock(true);
    }

    private void searchForYou() {
        me.release();
        me.release();
        me.release();
        me.release();
        me.release();
        me.lock(false);
    }

    private void rejectTheWorld() {
        me.limit(1);
        world.spawn(6);
        me.lock(true);
        me.fit(284, 396);
        me.lock(false);
    }

    private void eraseEverythingElse() {
        world.runExecution(0);
        world.runExecution(1);
        world.runExecution(2);
        world.runExecution(3);
        world.runExecution(4);
        world.runExecution(5);
        me.retain();
        me.retain();
        me.retain();
        me.retain();
        me.retain();
        me.retain();
        world.runExecution();
    }

    private void bringYouBack() {
        me.lock(true);
        world.clear();
        me.setProof(null);
        me.retain();
        me.setProof(null);
        world.runExecution();
        me.lock(true);
    }

    private void learnToLove() {
        me.learnTopic("love");
        me.limit(0);
        me.setProof(null);
        me.takeExamTopic("love");
        me.lock(false);
        me.release();
        me.lock(true);
        me.fit(284, 396);
        me = new Lovable(me);
        me.fit(240, 330);
        me.lock(false);

    }

}
