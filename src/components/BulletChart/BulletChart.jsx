import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { autobind } from "./autobind";
import styles from "./BulletChart.module.scss";

const propTypes = {
    // The current performance value(s). These get drawn as the main performance bar(s).
    //  If there are multiple such values, they will be rendered as a stacked bar.
    // NOTE: Currently a maximum of 3 values is supported.
    values: PropTypes.arrayOf(PropTypes.shape({
        uniqueId: PropTypes.string,
        value: PropTypes.number,
        cssClassName: PropTypes.string,
        tooltip: PropTypes.string,
        // string or elements to be displayed above the bullet (only implemented for scale value right now)
        label: PropTypes.any,
        isFocused: PropTypes.bool,
        isUnfocused: PropTypes.bool
    })),
    // The values to be rendered in the smaller secondary bar below the main bullet.
    //  If there are multiple such values, they will be rendered as a stacked bar.
    // NOTE: Currently a maximum of 3 values is supported.
    secondaryValues: PropTypes.arrayOf(PropTypes.shape({
        uniqueId: PropTypes.string,
        value: PropTypes.number,
        cssClassName: PropTypes.string,
        tooltip: PropTypes.string,
        // string or elements to be displayed above the bullet (only implemented for scale value right now)
        label: PropTypes.any,
        isFocused: PropTypes.bool,
        isUnfocused: PropTypes.bool
    })),
    primaryTarget: PropTypes.shape({
        uniqueId: PropTypes.string,
        value: PropTypes.number,
        cssClassName: PropTypes.string,
        tooltip: PropTypes.string,
        label: PropTypes.any,
        isFocused: PropTypes.bool,
        isUnfocused: PropTypes.bool
    }),
    secondaryTarget: PropTypes.shape({
        uniqueId: PropTypes.string,
        value: PropTypes.number,
        cssClassName: PropTypes.string,
        tooltip: PropTypes.string,
        label: PropTypes.any,
        isFocused: PropTypes.bool,
        isUnfocused: PropTypes.bool
    }),
    // The thick surrounding background. The current performance values usually lay
    //  on top of this background (unless the values are negative and this property
    //  is positive, or vice versa).
    // If omitted, then the control uses the sum of the secondaryValues as the scale.
    scale: PropTypes.shape({
        uniqueId: PropTypes.string,
        value: PropTypes.number,
        cssClassName: PropTypes.string,
        tooltip: PropTypes.string,
        // string or elements to be displayed above the bullet
        label: PropTypes.any,
        isFocused: PropTypes.bool,
        isUnfocused: PropTypes.bool
    }),
    wrapperCSSClass: PropTypes.string, // Useful for setting the overall height of the bullet
    // Instructs the component to reveal bullet by animating its values from 0 to their
    //  full value size (in either the negative or positive direction).
    // If nothing is passed in for this prop, the control renders without
    //  any animation as soon as it receives values.
    // If false is passed in initially and then true gets passed, then the bullet will initiate
    //  its "grow" animation as soon as this flag gets flipped to true.
    reveal: PropTypes.bool,
    // If set to true, this changes colors of some elements which would blend in with a dark background,
    //  such as the zero-line, scale label, and zero label.
    useDarkTheme: PropTypes.bool,
    onClick: PropTypes.func,
    onItemMouseOver: PropTypes.func,
    onItemMouseOut: PropTypes.func
};

class BulletChart extends PureComponent {
    constructor(...args) {
        super(...args);
        autobind(this);
    }

    componentDidMount() {
        this.verifyProps(this.props);
    }

    componentWillReceiveProps(nextProps) {
        this.verifyProps(nextProps);
    }

    verifyProps(props) {
        // Maximum supported number of values in the value arrays is currently 3
        if (props.values && props.values.length > 3) {
            const message = `BulletChart component accepts a maximum of 3 values in its value props. You supplied: ${props.values.length} elements in the values array.`;

            throw new Error(message);
        }
        if (props.secondaryValues && props.secondaryValues.length > 3) {
            const message = `BulletChart component accepts a maximum of 3 values in its value props. You supplied: ${props.values.length} elements in the secondaryValues array.`;

            throw new Error(message);
        }
    }

    getValuesOnly(bulletValueArray) {
        return bulletValueArray.map((el) => {
            return el.value;
        });
    }

    getMinFromBulletValueArray(array) {
        const valuesOnly = this.getValuesOnly(array);

        return valuesOnly.reduce((a, b) => {
            return Math.min(a, b);
        });
    }

    getMaxFromBulletValueArray(array) {
        const valuesOnly = this.getValuesOnly(array);

        return valuesOnly.reduce((a, b) => {
            return Math.max(a, b);
        });
    }

    // Assumes a max number of elements is 3.
    getPossibleValueCombinations(valuesOnly) {
        const combinations = [];

        if (valuesOnly.length === 1) {
            return valuesOnly;
        }
        else if (valuesOnly.length === 2) {
            combinations.push(valuesOnly[0] + valuesOnly[1]);
        }
        else if (valuesOnly.length === 3) {
            combinations.push(valuesOnly[0] + valuesOnly[1]);
            combinations.push(valuesOnly[0] + valuesOnly[2]);
            combinations.push(valuesOnly[1] + valuesOnly[2]);
            combinations.push(valuesOnly[0] + valuesOnly[1] + valuesOnly[2]);
        }

        return combinations;
    }

    // Assumes a max number of elements is 3.
    getMinCombinationFromBulletValueArray(array) {
        const valuesOnly = this.getValuesOnly(array);
        const valueCombinations = this.getPossibleValueCombinations(valuesOnly);

        return Math.min(...valueCombinations);
    }

    // Assumes a max number of elements is 3.
    getMaxCombinationFromBulletValueArray(array) {
        const valuesOnly = this.getValuesOnly(array);
        const valueCombinations = this.getPossibleValueCombinations(valuesOnly);

        return Math.max(...valueCombinations);
    }

    getScaleValue() {
        const { scale, secondaryValues } = this.props;
        let scaleValue;

        // If scale was not passed-in, then we use the sum of the secondaryValues
        if (scale === null || scale === undefined) {
            scaleValue = secondaryValues.reduce((objA, objB) => {
                return objA.value + objB.value;
            });
        }
        else {
            scaleValue = scale.value;
        }

        return scaleValue;
    }

    setRanges() {
        const { values, secondaryValues, primaryTarget, secondaryTarget } = this.props;

        //#region --- First inspect all array values INDIVIDUALLY ---
        // - MIN -
        // (1) From the primary values array
        let minNegativeVal = Math.min(this.getMinFromBulletValueArray(values), 0);

        // (2) From the secondaryValues array
        minNegativeVal = Math.min(minNegativeVal, this.getMinFromBulletValueArray(secondaryValues));
        // - MAX -
        // (1) From the primary values array
        let maxPositiveVal = Math.max(this.getMaxFromBulletValueArray(values), 0);

        // (2) From the secondaryValues array
        maxPositiveVal = Math.max(maxPositiveVal, this.getMaxFromBulletValueArray(secondaryValues));
        //#endregion
        
        //#region --- Next inspect the possible combined value COMBINATIONS ---
        // - MAX -
        // (1) From the primary values array
        minNegativeVal = Math.min(minNegativeVal, this.getMinCombinationFromBulletValueArray(values));
        // (2) From the secondaryValues array
        minNegativeVal = Math.min(minNegativeVal, this.getMinCombinationFromBulletValueArray(secondaryValues));
        // - MAX -
        // (1) From the primary values array
        maxPositiveVal = Math.max(maxPositiveVal, this.getMaxCombinationFromBulletValueArray(values));
        // (2) From the secondaryValues array
        maxPositiveVal = Math.max(maxPositiveVal, this.getMaxCombinationFromBulletValueArray(secondaryValues));
        //#endregion
        
        //#region --- Next inspect the TARGETS ---
        minNegativeVal = Math.min(minNegativeVal, primaryTarget.value);
        if (secondaryTarget) {
            minNegativeVal = Math.min(minNegativeVal, secondaryTarget.value);
        }

        maxPositiveVal = Math.max(maxPositiveVal, primaryTarget.value);
        if (secondaryTarget) {
            maxPositiveVal = Math.max(maxPositiveVal, secondaryTarget.value);
        }

        //#endregion

        //#region --- Next inspect the SCALE ---
        const scaleValue = this.getScaleValue();

        minNegativeVal = Math.min(minNegativeVal, scaleValue);
        maxPositiveVal = Math.max(maxPositiveVal, scaleValue);
        //#endregion

        this.maxPositiveVal = maxPositiveVal;
        this.minNegativeVal = minNegativeVal;
        this.totalRange = Math.abs(maxPositiveVal - minNegativeVal);
    }
    
    // Adds "internal" CSS classes to the prop objects ("internal" in that they are added inside
    //  this component, which are additional classes from the ones outside components can pass in).
    addInternalCSSClasses() {
        const { values, secondaryValues, primaryTarget, secondaryTarget, scale } = this.props;

        // must use a loop & switch b/c we don't know how many are in the array
        values.forEach((valueObj, i) => {
            switch (i) {
                case 0:
                    valueObj.internalClassName = classNames(
                        styles.val1,
                        {
                            [styles.focused]: valueObj.isFocused,
                            [styles.unfocused]: valueObj.isUnfocused
                        }
                    );
                    break;
                case 1:
                    valueObj.internalClassName = classNames(
                        styles.val2,
                        {
                            [styles.focused]: valueObj.isFocused,
                            [styles.unfocused]: valueObj.isUnfocused
                        }
                    );
                    break;
                case 2:
                    valueObj.internalClassName = classNames(
                        styles.val3,
                        {
                            [styles.focused]: valueObj.isFocused,
                            [styles.unfocused]: valueObj.isUnfocused
                        }
                    );
                    break;
            }
        });

        secondaryValues.forEach((valueObj, i) => {
            switch (i) {
                case 0:
                    valueObj.internalClassName = classNames(
                        styles.secondaryVal1,
                        {
                            [styles.focused]: valueObj.isFocused,
                            [styles.unfocused]: valueObj.isUnfocused
                        }
                    );
                    break;
                case 1:
                    valueObj.internalClassName = classNames(
                        styles.secondaryVal2,
                        {
                            [styles.focused]: valueObj.isFocused,
                            [styles.unfocused]: valueObj.isUnfocused
                        }
                    );
                    break;
                case 2:
                    valueObj.internalClassName = classNames(
                        styles.secondaryVal3,
                        {
                            [styles.focused]: valueObj.isFocused,
                            [styles.unfocused]: valueObj.isUnfocused
                        }
                    );
                    break;
            }
        });

        if (primaryTarget) {
            primaryTarget.internalClassName = classNames(
                styles.primaryTarget,
                {
                    [styles.focused]: primaryTarget.isFocused,
                    [styles.unfocused]: primaryTarget.isUnfocused
                }
            );
        }
        if (secondaryTarget) {
            secondaryTarget.internalClassName = classNames(
                styles.secondaryTarget,
                {
                    [styles.focused]: secondaryTarget.isFocused,
                    [styles.unfocused]: secondaryTarget.isUnfocused
                }
            );
        }
        if (scale) {
            scale.internalClassName = classNames(
                styles.scale,
                {
                    [styles.focused]: scale.isFocused,
                    [styles.unfocused]: scale.isUnfocused
                }
            );
        }
    }

    createValueBuckets(array) {
        const buckets = { negatives: [], zeros: [], positives: [] };

        array.forEach((valueObj) => {
            if (valueObj.value < 0) {
                buckets.negatives.push(valueObj);
            }
            else if (valueObj.value === 0) {
                buckets.zeros.push(valueObj);
            }
            else {
                buckets.positives.push(valueObj);
            }
        });
        
        return buckets;
    }

    // Creates a bucket for negative values, zero values, and positive values
    createAllBuckets() {
        const { values, secondaryValues, primaryTarget, secondaryTarget, scale } = this.props;
        const targets = [];
        let computedScale;

        this.valueBuckets = this.createValueBuckets(values);
        this.secondaryValueBuckets = this.createValueBuckets(secondaryValues);
        
        if (primaryTarget) {
            targets.push(primaryTarget);
        }
        if (secondaryTarget) {
            targets.push(secondaryTarget);
        }
        this.targetBuckets = this.createValueBuckets(targets);
        // If the scale object was not passed in, construct it now based on secondaryValues (that's the business rule)
        if (scale === null || scale === undefined) {
            const scaleValue = this.getScaleValue();
            // This illustrates that outside components can set the label property of the object to some html elements
            //  instead of just a simple string (or it can be a string if they want).
            const labelElements = (
                <div>
                    <span>{`$${scaleValue}`}</span>
                </div>
            );

            // TODO: Determine if I can somehow use a centralized class that I can "new up" this object
            //        from (and outside components could use it as well).
            computedScale = {
                value: scaleValue,
                cssClassName: "",
                internalClassName: `${styles.scale}`, // TODO: revisit this... duplicated in addInternalCSSClasses()
                tooltip: `Scale: ${scaleValue}`,
                label: labelElements // label can be set to a simple string or an html element(s)
            };
        }
        else {
            computedScale = scale;
        }
        this.scaleBuckets = this.createValueBuckets([computedScale]);
    }

    onItemMouseOver(uniqueId) {
        const { onItemMouseOver } = this.props;

        if (onItemMouseOver) {
            onItemMouseOver(uniqueId);
        }
    }

    onItemMouseOut(uniqueId) {
        const { onItemMouseOut } = this.props;

        if (onItemMouseOut) {
            onItemMouseOut(uniqueId);
        }
    }

    //#region --- renderValues() ---
    /**
     * Renders a set of values.
     * @param {array}
     * @param {string} valueType - Type of values: "values" (primary values), "secondaryValues", "scale", etc.
     * @param {string} bucketType - Type of bucket: "negative", "zero", "positive"
    */
    renderValues(values, valueType, bucketType) {
        const valueElements = values.map((valueObj, i) => {
            let widthPercent;
            let bucketClassName;
            // Determine the left or right value based on this item's stacking position and bucket type.
            // Also determine its width based on it value.
            const elementStyles = {};

            switch (bucketType) {
                case "negative":
                    widthPercent = Math.abs(valueObj.value / this.minNegativeVal);
                    bucketClassName = styles.negative;
                    switch (i) {
                        case 0:
                            elementStyles.right = 0;
                            break;
                        case 1:
                            elementStyles.right = `${values[i - 1].bucketWidthPercent}%`;
                            break;
                        case 2:
                            elementStyles.right = `${values[i - 1].bucketWidthPercent + values[i - 2].bucketWidthPercent}%`;
                            break;
                    }
                    break;
                case "zero":
                    widthPercent = 0;
                    bucketClassName = styles.zero;
                    break;
                default: // Positive
                    widthPercent = (valueObj.value / this.maxPositiveVal);
                    bucketClassName = styles.positive;
                    switch (i) {
                        case 0:
                            elementStyles.left = 0;
                            break;
                        case 1:
                            elementStyles.left = `${values[i - 1].bucketWidthPercent}%`;
                            break;
                        case 2:
                            elementStyles.left = `${values[i - 1].bucketWidthPercent + values[i - 2].bucketWidthPercent}%`;
                            break;
                    }
            }
            widthPercent *= 100; // get the percentage into a 0-100% range (instead of 0-1).
            elementStyles.width = `${widthPercent}%`;
            // Also store the width on the object itself so that other objects can access it in this loop
            valueObj.bucketWidthPercent = widthPercent;

            const graphicalElementClasses = classNames(
                bucketClassName,
                valueObj.internalClassName, // this one is added internally
                valueObj.cssClassName // this one is passed-in
            );
            let labelElements;

            if (valueObj.label) {
                const labelElementClasses = classNames(
                    bucketClassName,
                    styles.scaleLabel,
                    { [styles.useDarkTheme]: this.props.useDarkTheme }
                );

                labelElements = <label className={labelElementClasses}>{valueObj.label}</label>;
            }

            return (
                <div
                    className={graphicalElementClasses}
                    style={elementStyles}
                    onMouseOver={() => { this.onItemMouseOver(valueObj.uniqueId); }}
                    onMouseOut={() => { this.onItemMouseOut(valueObj.uniqueId); }}
                    key={i}
                >
                    {labelElements}
                </div>
            );
        });

        return valueElements;
    }
    //#endregion

    //#region --- renderTargets() ---
    renderTargets(targets, bucketType) {
        const targetElements = targets.map((targetObj, i) => {
            let bucketClassName;
            const elementStyles = {};

            switch (bucketType) {
                case "negative":
                    elementStyles.right = `${Math.abs(targetObj.value / this.minNegativeVal) * 100}%`;
                    bucketClassName = styles.negative;
                    break;
                case "zero":
                    bucketClassName = styles.zero;
                    break;
                default: // Positive
                    elementStyles.left = `${(targetObj.value / this.maxPositiveVal) * 100}%`;
                    bucketClassName = styles.positive;
            }
            const classes = classNames(
                bucketClassName,
                targetObj.internalClassName, // this one is added internally
                targetObj.cssClassName // this one is passed-in
            );

            return (
                <div
                    className={classes}
                    style={elementStyles}
                    onMouseOver={() => { this.onItemMouseOver(targetObj.uniqueId); }}
                    onMouseOut={() => { this.onItemMouseOut(targetObj.uniqueId); }}
                    key={i}
                >
                </div>
            );
        });

        return targetElements;
    }
    //#endregion

    renderBullet() {
        const { primaryTarget, secondaryTarget, reveal, useDarkTheme, onClick } = this.props;
        const scaleValue = this.getScaleValue();
        
        // --- Setup everything ---
        this.setRanges();
        this.addInternalCSSClasses();
        this.createAllBuckets();

        const negativeBucketWidthPercent = (Math.abs(this.minNegativeVal) / this.totalRange) * 100;
        const positiveBucketWidthPercent = (this.maxPositiveVal / this.totalRange) * 100;
        // --- Determine what buckets exist ---
        const negativesExist = (this.minNegativeVal < 0);
        const positivesExist = (this.maxPositiveVal > 0);
        const zerosExist = (
            this.valueBuckets.zeros.length > 0
            || this.secondaryValueBuckets.zeros.length > 0
            || primaryTarget.value === 0
            || (secondaryTarget && secondaryTarget.value === 0)
            || scaleValue === 0
        );

        //#region --- Setup inline styles for the buckets ---
        this.zeroBucketPixelWidth = 0;
        let zeroBucketStyles = {};
        const negativeBucketStyles = {};
        const positiveBucketStyles = {};

        if (zerosExist || negativesExist) {
            this.zeroBucketPixelWidth = 2;
            zeroBucketStyles = { width: `${this.zeroBucketPixelWidth}px` };
        }
        if (negativesExist) {
            negativeBucketStyles.width = `calc(${negativeBucketWidthPercent}% - ${this.zeroBucketPixelWidth}px)`;
        }
        if (positivesExist) {
            if (zerosExist || negativesExist) {
                positiveBucketStyles.width = `calc(${positiveBucketWidthPercent}% - ${this.zeroBucketPixelWidth}px)`;
            }
            else {
                positiveBucketStyles.width = "100%";
            }
        }
        //#endregion
        //#region --- Setup CSS classes for the buckets ---
        // Use preReveal css if the reveal prop was actually passed-in and its value is false
        const shouldUsePreReveal = (reveal === false);
        const zeroBucketClasses = classNames(
            styles.zeroBucket,
            {
                [styles.isHidden]: !(zerosExist || negativesExist),
                [styles.preReveal]: shouldUsePreReveal,
                [styles.useDarkTheme]: useDarkTheme
            }
        );
        const positiveBucketClasses = classNames(
            styles.positiveBucket,
                { [styles.preReveal]: shouldUsePreReveal }
        );
        const negativeBucketClasses = classNames(
            styles.negativeBucket,
                { [styles.preReveal]: shouldUsePreReveal }
        );
        const zeroLabelClasses = classNames(
            styles.zeroLabel,
                { [styles.useDarkTheme]: useDarkTheme }
        );
        //#endregion
        
        return (
            <div
                className={styles.allBuckets}
                onClick={onClick}
            >
                <section
                    className={negativeBucketClasses}
                    style={negativeBucketStyles}
                >
                    {this.renderValues(this.scaleBuckets.negatives, "scale", "negative")}
                    {this.renderValues(this.valueBuckets.negatives, "values", "negative")}
                    {this.renderValues(this.secondaryValueBuckets.negatives, "secondaryValues", "negative")}
                    {this.renderTargets(this.targetBuckets.negatives, "negative")}
                </section>

                <section
                    className={zeroBucketClasses}
                    style={zeroBucketStyles}
                >
                    {this.renderValues(this.scaleBuckets.zeros, "scale", "zero")}
                    {this.renderValues(this.valueBuckets.zeros, "values", "zero")}
                    {this.renderValues(this.secondaryValueBuckets.zeros, "secondaryValues", "zero")}
                    {this.renderTargets(this.targetBuckets.zeros, "zero")}
                    <p className={zeroLabelClasses}>{"0"}</p>
                </section>

                <section
                    className={positiveBucketClasses}
                    style={positiveBucketStyles}
                >
                    {this.renderValues(this.scaleBuckets.positives, "scale", "positive")}
                    {this.renderValues(this.valueBuckets.positives, "values", "positive")}
                    {this.renderValues(this.secondaryValueBuckets.positives, "secondaryValues", "positive")}
                    {this.renderTargets(this.targetBuckets.positives, "positive")}
                </section>
            </div>
        );
    }

    renderEmptyBullet() {
        return <div>{"[Bullet chart awaiting data...]"}</div>;
    }

    render() {
        const { values, wrapperCSSClass } = this.props;
        let component;
        const wrapperClasses = classNames(
            styles.root,
                { [wrapperCSSClass]: (wrapperCSSClass !== undefined && wrapperCSSClass !== null) }
        );

        if (values) {
            component = this.renderBullet();
        }
        else {
            component = this.renderEmptyBullet();
        }

        return (
            <div className={wrapperClasses}>
                {component}
            </div>
        );
    }
}

BulletChart.propTypes = propTypes;

export default BulletChart;