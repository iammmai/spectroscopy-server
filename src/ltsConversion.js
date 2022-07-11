import { parser } from "@pseuco/ccs-interpreter";
import * as R from "ramda";

const transformRecursiveCCS = (ccs, processName) => {
  return `${processName} := ${ccs} \n ${processName}`;
};

export const transformToLTS = (ccs, processName = "P0") => {
  const isRecursive = new RegExp(processName, "g").test(ccs);
  console.log(isRecursive, transformRecursiveCCS(ccs, processName));
  let initialState = parser.parse(
    isRecursive ? transformRecursiveCCS(ccs, processName) : ccs
  );
  const processDefinitions = isRecursive ? [`${processName} := ${ccs}`] : [];
  return {
    initialState: initialState.toString().replace("\n", ""),
    states: exploreStates({}, [initialState], processName, processDefinitions),
  };
};

// processName is passed in order to regognize a recursive ccs
const exploreStates = (
  acc,
  states,
  processName,
  processDefinitions,
  numCalls = 0
) => {
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
        numCalls > 10
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
    processName,
    processDefinitions,
    numCalls + 1
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
