import React from 'react';
import ReactDOM from 'react-dom';
import {component, state, effect, context, reducer} from './react-unhooked';

function counter(initialValue) {
    return use => {
        let r = use(reducer(c => c + 1, initialValue));
        return {
            value: r.value,
            increment: r.dispatch,
        };
    };
}

function mountEffect(callback) {
    return effect(props => {callback(props);}, () => []);
}

function unmountEffect(callback) {
    return effect(() => callback, () => []);
}

function stateFromProp(getter) {
    return (use, {update, addBeforeMountAction}) => {
        let v;
        // ??
        addBeforeMountAction(props => v = getter(props));
        return ({
            value: () => v,
            set: value => {
                v = value;
                update();
            },
        });
    };
}

function mousePosition() {
    return use => {
        let position = use(state());
        let onMouseMove = e => position.set({
            x: e.clientX, y: e.clientY,
            toString() {return `(${this.x}, ${this.y})`;},
        });
        use(effect(
            () => {
                window.addEventListener('mousemove', onMouseMove);
                return () => {
                    window.removeEventListener('mousemove', onMouseMove);
                };
            },
            () => []));
        return {value: position.value};
    };
}

let MyChild = component(
    use => {
        use(effect(() => {
            console.log('Showing...');
            return () => console.log('Hiding...');
        }, () => []));
    },
    () => (
        <p>Hi!</p>
    ));

let MyContext = React.createContext(2);

function init(use) {
    let counter0 = use(counter(0));
    let counter10 = use(counter(10));
    let update = use(updatePart());
    let mouse = use(mousePosition());
    use(mountEffect(() => console.log('mounted')));
    use(effect(
        ({counter10}) => console.log(`counter changed to ${counter10.value()}`),
        ({counter10}) => [counter10.value()]));
    let myContext = use(context(MyContext));
    let inputRef = React.createRef();
    return {counter0, counter10, mouse, inputRef, myContext};
}

function render({counter0, counter10, mouse, inputRef, myContext}) {
    // console.log('rendering...');
    return (
        <div>
            <button onClick={counter0.increment}>
                Count: {counter0.value()}
            </button>
            <button onClick={counter10.increment}>
                Count: {counter10.value()}
            </button>
            {counter0.value() % 2 === 1 && <MyChild/>}
            <div>Mouse position
                is {`(${mouse.value()?.x}, ${mouse.value()?.y})`}
            </div>
            <button onClick={() => inputRef.current.focus()}>Focus input</button>
            <input ref={inputRef}/>
            <div>The context value is {myContext.value()}</div>
        </div>
    );
}

let MyMain = component(init, render);

ReactDOM.render(
    <MyContext.Provider value={5}>
        <MyMain/>
    </MyContext.Provider>,
    document.getElementById('root'));
