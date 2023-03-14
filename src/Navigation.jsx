import "./Navigation.scss";

import Button from "./components/General/Button";

function Navigation() {
  return (
    <div className="nav">
      <div className="nav__wrapper clearfix">
        <div className="logo float-left">
          <p>T</p>
        </div>
        <div className="controls float-right">
          <Button
            classObject="light"
            onClick={() => {
              console.log("home");
            }}
            id="home"
            btnText="HOME"
          />
          <Button
            classObject="light"
            onClick={() => {
              console.log("aboutme");
            }}
            id="about-me"
            btnText="ABOUT ME"
          />
          <Button
            classObject="light"
            onClick={() => {
              console.log("mycareer");
            }}
            id="my-career"
            btnText="MY CAREER"
          />
          <Button
            classObject="light"
            onClick={() => {
              console.log("contactus");
            }}
            id="contact-us"
            btnText="CONTACT ME"
          />
        </div>
      </div>
    </div>
  );
}

export default Navigation;
