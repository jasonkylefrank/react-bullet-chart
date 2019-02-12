const exclude = [
    "constructor",
    "render",
    "componentWillMount",
    "componentDidMount",
    "componentWillReceiveProps",
    "shouldComponentUpdate",
    "componentWillUpdate",
    "componentDidUpdate",
    "componentWillUnmount"
];

export function autobind(component, customExcludes = [], regex = /.*/) {
    const bound = [];
    const mergedExcludes = [...exclude, ...customExcludes];

    for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(component))) {
        const propertyOrMethod = component[name];

        if (typeof propertyOrMethod === "function" && !mergedExcludes.includes[name] && regex.test(name)) {
            component[name] = propertyOrMethod.bind(component);
            bound.push(name);
        }
    }

    return bound;
}