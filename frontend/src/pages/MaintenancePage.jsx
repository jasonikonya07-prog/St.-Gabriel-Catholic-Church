import { useSiteSettings } from "../context/SiteSettingsContext";
import Maintenance from "./Maintenance";

function MaintenancePage() {
  const { settings } = useSiteSettings();

  return <Maintenance settings={settings} />;
}

export default MaintenancePage;
