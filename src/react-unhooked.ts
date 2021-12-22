import {Context, Component, createElement, PropsWithChildren, ReactElement} from 'react';

export interface Use {
    <R>(part: Part<R>): R;
}

export interface PartArgs<P> {
    update: () => void,
    addEffect: (e: Effect<P>) => void,
    addContext: <T>(e: ContextWrapper<T>) => void,
}

export interface Part<R, P = any> {
    (use: Use, args: PartArgs<P>): R;
}

export interface ReadonlyState<T> {
    value: () => T;
}

export interface State<T> extends ReadonlyState<T> {
    set: (value: T) => void;
}

export interface Reducer<T, A> {
    value: () => T;
    dispatch: (action: A) => void;
}

export interface Render<P = {}> {
    (props: PropsWithChildren<P>): ReactElement<any, any> | null;
}

export interface Effect<P> {
    effect: (props: P, prevProps?: P) => () => void;
    shouldRun?: (props: P, prevProps?: P) => boolean;
    uneffect?: () => void;
}

export interface ContextWrapper<T> {
    cls: Context<T>;
    set: (value: T) => void;
}

export function component<P, R>(init: Part<R>, render: Render<P & R>) {

    return class UnhookedComponent extends Component<P, {}> {

        _initResult: R;
        _effects: Effect<P>[] = [];
        _render = render;

        constructor(props: P) {
            super(props);
            this._initResult = this._use(init);
        }

        render() {
            return this._render(this._allProps());
        }

        componentDidMount() {
            let props = this._allProps();
            this._effects.forEach(e => {
                e.shouldRun?.(props); // call to set internal state but ignore
                e.uneffect = e.effect?.(props);
            });
        }

        componentDidUpdate(prevProps: P, prevState: {}, snapshot?: any) {
            let props = this._allProps();
            this._effects.forEach(e => {
                if (!e.shouldRun || e.shouldRun(props, prevProps)) {
                    e.uneffect?.();
                    e.uneffect = e.effect?.(props, prevProps);
                }
            });
        }

        componentWillUnmount() {
            this._effects.forEach(e => {
                e.uneffect?.();
            });
        }

        _allProps() {
            return Object.assign({}, this.props, this._initResult);
        }

        _use<R>(part: Part<R>): R {
            return part(
                this._use.bind(this), {
                    update: () => this.setState({}),
                    addEffect: (effect: Effect<P>) => {
                        this._effects.push(effect);
                    },
                    addContext: (context: ContextWrapper<any>) => {
                        this._wrapWithContext(context);
                        // this._contexts.push(context);
                    },
                });
        }

        _wrapWithContext<T>(context: ContextWrapper<T>) {
            let render = this._render;
            this._render = props =>
                createElement(context.cls.Consumer, undefined,
                    (value: T) => {
                        context.set(value);
                        return render(props);
                    });
        }
    };
}

export function state<T>(initialValue: T): Part<State<T>> {
    return (use, {update}) => {
        let v = initialValue;
        return ({
            value: () => v,
            set: (value: T) => {
                v = value;
                update();
            },
        });
    };
}

export function effect<P>(
    callback: (props: P, prevProps?: P) => () => void,
    deps?: (props: P, prevProps?: P) => any[]): Part<undefined, P> {
    let prevDeps: any[] | undefined = undefined;
    return (use: Use, args: PartArgs<P>) => {
        args.addEffect({
            effect: callback,
            shouldRun: (props, prevProps) => {
                if (!deps) return true;
                let ds = deps(props, prevProps);
                if (!Array.isArray(ds)) return false;
                let should = !prevDeps || ds.some((d, i) => d !== prevDeps![i]);
                prevDeps = ds;
                return should;
            }
        });
        return undefined;
    };
}

export function context<T>(cls: Context<T>): Part<ReadonlyState<T>> {
    return (use: Use, args: PartArgs<any>) => {
        let v: T;
        args.addContext({cls, set: value => v = value});
        return {value: () => v};
    };
}

export function reducer<T, A>(
    red: (value: T, action: A) => T,
    initialValue: T
): Part<Reducer<T, A>> {
    return (use: Use) => {
        let s = use(state(initialValue));
        return {
            value: s.value,
            dispatch: (action: A) => s.set(red(s.value(), action)),
        }
    };
}
