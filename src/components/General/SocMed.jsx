import "./SocMed.scss";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

library.add(fab, fas, far);

function SocMed() {
  return (
    <div className="social__wrapper">
      <a href="" className="">
        <FontAwesomeIcon icon={["fab", "github"]} />
      </a>
      <a href="" className="">
        <FontAwesomeIcon icon={["fab", "linkedin-in"]} />{" "}
      </a>
      <a href="" className="">
        <FontAwesomeIcon icon={["fab", "facebook-f"]} />{" "}
      </a>
      <a href="" className="">
        <FontAwesomeIcon icon={["fab", "twitter"]} />{" "}
      </a>
      <a href="" className="">
        <FontAwesomeIcon icon={["fab", "twitter"]} />{" "}
      </a>
    </div>
  );
}

export default SocMed;
