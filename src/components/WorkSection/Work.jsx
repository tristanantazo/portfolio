import "./Work.scss";

import Btn from "../General/Button";
import WorkItem from "./WorkItem";

function Work(params) {
  return (
    <div className="work_container p-8">
      <h2 className="outline">Works</h2>
      <div className="wrapper">
        <WorkItem title="Todo App with Spotify Web player">
          <img src="project.jpeg" alt="" />
          <div className="discription">
            <h4>Sample Title</h4>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore
              debitis deserunt quis libero distinctio sed sapiente repellat
            </p>
            <Btn onClick="" classObject="dark" btnText="Visit the page" />
          </div>
        </WorkItem>
        <WorkItem title="Todo App with Spotify Web player API">
          <img src="project.jpeg" alt="" />
          <div className="discription">
            <h4>Sample Title</h4>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore
              debitis deserunt quis libero distinctio sed sapiente repellat
            </p>
            <Btn onClick="" classObject="dark" btnText="Visit the page" />
          </div>
        </WorkItem>
        <WorkItem title="Todo App with Spotify Web player API">
          <img src="project.jpeg" alt="" />
          <div className="discription">
            <h4>Sample Title</h4>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore
              debitis deserunt quis libero distinctio sed sapiente repellat
            </p>
            <Btn onClick="" classObject="dark" btnText="Visit the page" />
          </div>
        </WorkItem>
        <WorkItem title="Todo App with Spotify Web player API">
          <img src="project.jpeg" alt="" />
          <div className="discription">
            <h4>Sample Title</h4>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore
              debitis deserunt quis libero distinctio sed sapiente repellat
            </p>
            <Btn onClick="" classObject="dark" btnText="Visit the page" />
          </div>
        </WorkItem>
        <WorkItem title="Todo App with Spotify Web player API">
          <img src="project.jpeg" alt="" />
          <div className="discription">
            <h4>Sample Title</h4>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore
              debitis deserunt quis libero distinctio sed sapiente repellat
            </p>
            <Btn onClick="" classObject="dark" btnText="Visit the page" />
          </div>
        </WorkItem>
        <WorkItem title="Todo App with Spotify Web player API">
          <img src="project.jpeg" alt="" />
          <div className="discription">
            <h4>Sample Title</h4>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore
              debitis deserunt quis libero distinctio sed sapiente repellat
            </p>
            <Btn onClick="" classObject="dark" btnText="Visit the page" />
          </div>
        </WorkItem>
      </div>
    </div>
  );
}

export default Work;
