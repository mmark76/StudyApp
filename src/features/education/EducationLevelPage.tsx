import { useNavigate } from "react-router-dom";
import { EducationLevelSelector } from "./EducationLevelSelector";
import { type EducationLevel } from "./educationProfiles";
import { useEducationProfile } from "./useEducationProfile";

export function EducationLevelPage() {
  const navigate = useNavigate();
  const { selectEducationLevel } = useEducationProfile();

  async function chooseEducationLevel(level: EducationLevel) {
    await selectEducationLevel(level);
    navigate("/");
  }

  return (
    <div className="stack-lg">
      <EducationLevelSelector onSelect={chooseEducationLevel} />
    </div>
  );
}
