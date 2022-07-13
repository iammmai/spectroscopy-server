import { parser } from "@pseuco/ccs-interpreter";
import * as R from "ramda";

export const transformToLTS = (ccs, processName = "P0", relatedProcesses) => {
  const isRecursive = new RegExp(processName, "g").test(ccs);
  const recursiveDefinitions = isRecursive ? [`${processName} := ${ccs}`] : [];
  const relatedDefinitions = relatedProcesses.map(
    (process) => `${process.processName}:= ${process.ccs}`
  );
  const processDefinitions = R.join("\n", [
    ...relatedDefinitions,
    ...recursiveDefinitions,
  ]);

  let initialState = parser.parse(
    isRecursive
      ? `${processDefinitions}\n${processName}`
      : `${processDefinitions}\n${ccs}`
  );

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
    if (stateKey === processName || Object.keys(acc).includes(stateKey)) {
      return prev;
    }
    return {
      ...prev,
      [stateKey]: {
        transitions: currentState.getPossibleSteps(true).map((step) => {
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
      const stateString = state.toString();
      return (
        !!stateString.match(/^(0\|)*0$/gm) ||
        stateString === processName ||
        Object.values(acc).length === Object.values(newStates).length //no new states explored => recursive definition
      );
    })(statesCopy)
  ) {
    return newStates;
  }

  return exploreStates(
    newStates,
    R.chain(
      (state) =>
        state.getPossibleSteps(true).map((step) => {
          return step.perform();
        }),
      statesCopy
    ),
    processName
  );
};

export const renameStates = (lts, processName = "P0", processCCS) => {
  const prefix = R.head(processName);
  let sorted = Object.keys(lts.states).sort((a, b) => {
    return b.length - a.length;
  });

  let newStateNames = sorted.reduce(
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
          ccs:
            newKey === processName
              ? parser.parse(processCCS).toString().replace("\n", "")
              : oldKey,
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
