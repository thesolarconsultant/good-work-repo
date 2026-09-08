// Mount point only. Everything the salon app is lives in /crm, so it can be
// lifted out of this repo as one folder without unpicking it from the site.
import SalonApp from "../../crm/ui/App.jsx";

export default function Crm() {
  return <SalonApp />;
}
