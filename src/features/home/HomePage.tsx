import { Link } from "react-router-dom";
import { studyConfig } from "../../app/studyConfig";

export function HomePage() {
  return (
    <div className="stack-lg">
      <section className="hero-panel simple-home-hero">
        <p className="eyebrow">Welcome</p>
        <h2>{studyConfig.subjectName || "Your study space"}</h2>
        <p>{studyConfig.description}</p>
        <p className="muted">Start with one step. You can add material, study, review or adjust your settings whenever you are ready.</p>
        <div className="button-row">
          <Link className="button primary" to="/study">Start studying</Link>
          <Link className="button secondary" to="/library">Open library</Link>
        </div>
      </section>

      <section className="content-panel simple-home-panel">
        <div>
          <p className="eyebrow">Choose what you need</p>
          <h3>No dashboard overload</h3>
          <p>Use the top navigation when you want more detail. The home screen stays light so you can decide your next action calmly.</p>
        </div>
        <div className="button-row">
          <Link className="button secondary" to="/import">Add content</Link>
          <Link className="button secondary" to="/review">Review cards</Link>
          <Link className="button secondary" to="/progress">Progress</Link>
        </div>
      </section>
    </div>
  );
}
