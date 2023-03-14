import "./AboutMe.scss";

function AboutMe() {
  return (
    <div className="about-me-section clearfix">
      <div className="wrapper float-left">
        <div className="details p-8 border-radius">
          <h2>Tech I've Used</h2>
          <div className="skills">
            <p>Larvel</p>
            <p>VueJs 3 / 2</p>
            <p>PHP</p>
            <p>MySql</p>
            <p>Html</p>
            <p>Css</p>
            <p>React</p>
            <p>Python</p>
          </div>
          <h2>About Me</h2>
          <p>
            Hi, I'm Tristan, you can call me Tristan, year 2018 I was graduated
            as Bachelor in Science in Information Technology major in Software
            Engineer. I've been working as Web Developer for 4 years, and I've
            worked in different type of projects like Fintech, Website Blog,
            Crowdfunding applications.
          </p>
        </div>
      </div>
      <div className="right-column float-right">
        <img src="tree.png" alt="" />
      </div>
    </div>
  );
}

export default AboutMe;
