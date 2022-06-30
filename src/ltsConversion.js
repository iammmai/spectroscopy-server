import { parser } from "@pseuco/ccs-interpreter";
import * as R from "ramda";

export const transformToLTS = (ccs, processName = "P0") => {
  let initialState = parser.parse(ccs);
  return {
    initialState: initialState.toString().replace("\n", ""),
    states: exploreStates({}, [initialState], processName),
  };
};

// processName is passed in order to regognize a recursive ccs
const exploreStates = (acc, states, processName) => {
  //getPossibleSteps mutates state if there is | - operator! that is why make a deep clone first
  const statesCopy = R.clone(states);
  const exploredStates = states.reduce((prev, currentState) => {
    const stateKey = currentState.toString().replace("\n", "");

    // detect recursion
    if (stateKey === processName) {
      return prev;
    }
    return {
      ...prev,
      [stateKey]: {
        transitions: currentState.getPossibleSteps().map((step) => {
          step.copyOnPerform = true;
          return {
            label: step.toString(),
            target: step.perform().toString(),
          };
        }),
      },
    };
  }, {});

  const newStates = {
    ...acc,
    ...exploredStates,
  };

  if (
    R.all((state) => {
      return (
        !!state.toString().match(/^(0\|)*0$/gm) ||
        state.toString() === processName
      );
    })(statesCopy)
  ) {
    return newStates;
  }

  return exploreStates(
    newStates,
    R.chain(
      (state) =>
        state.getPossibleSteps().map((step) => {
          step.copyOnPerform = true;
          return parser.parse(step.perform().toString());
        }),
      statesCopy
    ),
    processName
  );
};

export const renameStates = (lts, processName = "P0") => {
  const prefix = R.head(processName);
  let newStateNames = Object.keys(lts.states)
    .sort((a, b) => b.length - a.length)
    .reduce(
      (acc, key) => ({
        ...acc,
        [key]: `${prefix}${Object.values(acc).length}`,
      }),
      {}
    );

  // add renaming incase of recursion
  newStateNames = { ...newStateNames, [processName]: processName };

  const newStates = Object.entries(newStateNames).reduce(
    (acc, [oldKey, newKey]) => {
      if (oldKey === processName) return acc;
      return {
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
      };
    },
    {}
  );
  return {
    initialState: processName,
    states: newStates,
  };
};
