import "./ContactMe.scss";

import Button from "../General/Button";
import SocMed from "../General/SocMed";

function ContactMe() {
  return (
    <div className="contact-me-stack ">
      <div className="wrapper">
        <h2 className="m-tb-3">Contact Me</h2>
        <h4 className="m-tb-3">
          Email me @ <span>viel.antazo@gmail.com</span>
        </h4>

        <SocMed />

        <input
          className="m-tb-7 m-lr-auto p-7"
          type="text"
          name=""
          id=""
          placeholder="Email"
        />
        <input
          className="p-7 m-tb-7 m-lr-auto"
          type="text"
          placeholder="Subject"
        />
        <textarea
          className="p-7 m-tb-7 m-lr-auto"
          name=""
          id=""
          cols="30"
          rows="10"
          placeholder="Message"
        ></textarea>
        <Button
          id="contact_submit"
          onClick={console.log("submit")}
          classObject="light"
          btnText="Send"
        />
      </div>
    </div>
  );
}

export default ContactMe;
