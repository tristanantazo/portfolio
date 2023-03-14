import "./LandingStack.scss";

import Btn from "../General/Button";
import SocMed from "../General/SocMed";

function LandingStack() {
  return (
    <div className="landing-stack dark-bg clearfix">
      <img className="image float-left" src="img3.jpg" alt="" />
      <div className="greeting float-right">
        <div className="greeting__wrapper">
          <h1>Hello,</h1>
          <br />
          <h1 className="underline underline-color-light">
            I'm Tristan Viel Antazo
          </h1>
          <h3>Back - end / Front - end Web Developer</h3>
          <p>
            A 25 year old Web Developer living in Metro Manila, Philippines.
            I've been in the Software Development for 4 years, currently
            focusing in web development using Laravel and VueJs as my main
            technology stack
          </p>
          <div className="controls">
            <Btn onClick="" classObject="light" btnText="Resume" />
            <SocMed />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingStack;
