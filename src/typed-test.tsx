import ReactDOM from 'react-dom';
import React from 'react';
import {
  component,
  context,
  Part,
  ReadonlyState,
  state,
  Use,
} from './react-unhooked';

type PartType<P extends Part<any>> = P extends Part<infer T> ? T : never;

interface Props {
  label: string;
}

let MyContext = React.createContext(2);
let MyContext2 = React.createContext(3);

function counter(initialValue: number) {
  return (use: Use) => {
    let s = use(state(initialValue));
    return {
      value: s.value,
      increment: () => s.set(s.value() + 1),
    };
  };
}

function init(use: Use) {
  return {
    count: use(counter(5)),
    myContext: use(context(MyContext)),
    myContext2: use(context(MyContext2)),
  };
}

type Results = ReturnType<typeof init>;
// interface Results {
//   count: PartType<ReturnType<typeof counter>>;
//   myContext: ReadonlyState<number>;
//   myContext2: ReadonlyState<number>;
// }

function render({label, count, myContext, myContext2}: Props & Results) {
  return (
    <div>
      <div>{label}{count.value()}</div>
      <button onClick={count.increment}>Increment</button>
      <div>Context is {myContext.value()}</div>
      <div>Context is {myContext2.value()}</div>
    </div>
  );
}

let MyTypedTest = component<Props, Results>(init, render);

ReactDOM.render(
  <MyContext2.Provider value={8}>
    <MyContext.Provider value={7}>
      <MyTypedTest label={'Count: '}/>
    </MyContext.Provider>
  </MyContext2.Provider>,
  document.getElementById('root'));
