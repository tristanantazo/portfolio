import "./Button.scss";

/**
 *
 * @param {
 * onClick=""
 * id=""
 * classObject=""
 * btnText=""
 * } props
 */

function Btn(props) {
  return (
    <button id={props.id} className={props.classObject}>
      {props.btnText}
    </button>
  );
}

export default Btn;
