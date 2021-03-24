import * as React from "react";
import ArrayUtils from "./util/array";

interface IProps {
  numPlayers: number;
  numDecks: number | null;
  onChange: (newNumDecks: number | null) => void;
}

const NumDecksSelector = (props: IProps): JSX.Element => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newNumDecks =
      e.target.value === "" ? null : parseInt(e.target.value, 10);
    props.onChange(newNumDecks);
  };

  return (
    <div className="num-decks-picker">
      <label>
        多少副牌:{" "}
        <select
          value={props.numDecks === null ? "" : props.numDecks}
          onChange={handleChange}
        >
          <option value="">预设</option>
          {ArrayUtils.range(props.numPlayers, (idx) => {
            const val = idx + 1;
            return (
              <option value={val} key={idx}>
                {val}
              </option>
            );
          })}
        </select>
      </label>
    </div>
  );
};

export default NumDecksSelector;
