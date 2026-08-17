import { cgcCertificates } from "../../archive/canonical-data.generated";
import CgcRegister from "./register";

export default function CgcRegisterPage() {
  return <CgcRegister records={cgcCertificates} />;
}
