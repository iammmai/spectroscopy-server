import { parser } from "@pseuco/ccs-interpreter";
import * as R from "ramda";

export const transformToLTS = (ccs) => {
  let initialState = parser.parse(ccs);
  return {
    initialState: initialState.toString().replace("\n", ""),
    states: exploreStates({}, [initialState]),
  };
};

const exploreStates = (acc, states) => {
  //getPossibleSteps mutates state if there is | - operator! that is why make a deep clone first
  const statesCopy = R.clone(states);

  const exploredStates = states.reduce((prev, currentState) => {
    return {
      ...prev,
      [currentState.toString().replace("\n", "")]: {
        transitions: currentState.getPossibleSteps().map((step) => ({
          label: step.toString(),
          target: step.perform().toString(),
        })),
      },
    };
  }, {});

  const newStates = {
    ...acc,
    ...exploredStates,
  };

  if (
    R.all((state) => {
      return !!state.toString().match(/^(0\|)*0$/gm);
    })(statesCopy)
  ) {
    return newStates;
  }

  return exploreStates(
    newStates,
    R.chain(
      (state) =>
        state
          .getPossibleSteps()
          .map((step) => parser.parse(step.perform().toString())),
      statesCopy
    )
  );
};

export const renameStates = (lts, prefix = "P") => {
  const newStateNames = Object.keys(lts.states)
    .sort((a, b) => b.length - a.length)
    .reduce(
      (acc, key) => ({
        ...acc,
        [key]: `${prefix}${Object.values(acc).length}`,
      }),
      {}
    );

  const newStates = Object.entries(newStateNames).reduce(
    (acc, [oldKey, newKey]) => ({
      ...acc,
      [newKey]: {
        ...lts.states[oldKey],
        ccs: oldKey,
        transitions: lts.states[oldKey].transitions?.map(
          ({ label, target }) => ({
            label,
            target: newStateNames[target],
          })
        ),
      },
    }),
    {}
  );
  return {
    initialState: `${prefix}0`,
    states: newStates,
  };
};
