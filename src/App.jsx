import "./App.scss";

import ContactMe from "./components/ContactMeSection/ContactMe";
import LandingStack from "./components/FirstSection/LandingStack";
import AboutMe from "./components/SecondSection/AboutMe";
import Work from "./components/WorkSection/Work";
import Navigation from "./Navigation";

function App() {
  return (
    <div className="App ad">
      <Navigation />
      <section className="landing section">
        <LandingStack />
      </section>
      <section className="about-me section">
        <AboutMe />
      </section>
      <section className="work section">
        <Work />
      </section>
      <section className="contact-me section">
        <ContactMe />
      </section>
    </div>
  );
}

export default App;
