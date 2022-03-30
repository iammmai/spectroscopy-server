import * as R from "ramda";
import FormulaModel from "./FormulaSchema.js";
import { parser } from "@pseuco/ccs-interpreter";

const transformToLTS = (ccs) => {
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

const renameStates = (lts, prefix = "P") => {
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

const FormulaController = {
  getBySpectroscopyId: async (ctx) => {
    const spectroscopyId = R.path(["params", "spectroscopyId"], ctx);
    ctx.body = await FormulaModel.find({ spectroscopyId });
  },
  create: async (ctx) => {
    const ccs = R.path(["request", "body", "ccs"], ctx);
    const prefix = R.path(["request", "body", "prefix"], ctx);
    const spectroscopyId = R.path(["request", "body", "spectroscopyId"], ctx);
    const lts = renameStates(transformToLTS(ccs), prefix);

    const spec = new FormulaModel({
      ccs,
      lts,
      spectroscopyId,
    });
    await spec.save().catch((err) => (ctx.body = err));
    ctx.body = spec;
  },
  update: async (ctx) => {
    const _id = R.path(["params", "id"], ctx);
    const ccs = R.path(["request", "body", "ccs"], ctx);
    const prefix = R.path(["request", "body", "prefix"], ctx);

    ctx.body = await FormulaModel.findOneAndUpdate(
      { _id },
      {
        ...R.path(["request", "body"], ctx),
        ...(ccs ? { lts: renameStates(transformToLTS(ccs), prefix) } : {}),
      },
      { new: true }
    );
  },
};

export default FormulaController;
