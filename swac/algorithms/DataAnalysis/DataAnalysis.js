/* 
 * DataAnalysis
 */
class DataAnalysis extends Algorithm {

    /**
     * Constructs a new DataAnalysis
     * 
     * @param {Object} options Object with options for data analysis
     * 
     * @returns {DataAnalysis}
     */
    constructor(options = {}) {
        super(options);
        this.name = 'DataAnalysis';
        this.desc.text = 'Analyse data';

        this.desc.opts[0] = {
            name: "colAttribute",
            desc: "Name of the attribute that distinguish between collections of datasets"
        };
        if (!options.colAttribute)
            this.options.colAttribute = 'col';

        this.desc.opts[1] = {
            name: "ignoredAttributes",
            desc: "Array of attributes that should be ignored"
        };
        if (!options.ignoredAttributes)
            this.options.ignoredAttributes = ['id', 'swac_fromName', 'isnew', 'cat', 'func'];

        // Internal attributes
        this.colDatasets = new Map();   // Key = Collection, value = List of Objects
        this.colDomains = new Map();    // Key = Collection, value = Map(variable,list of possible values)
        this.colConstraints = new Map();// Key = Collection, value = Map(variable, list of constraints)
        this.csp = {
            variables: [],
            domains: new Map(),
            constraints: new Map()
        };
    }

    init(data) {
        return new Promise((resolve, reject) => {
            this.data = data;
        });
    }

    calcCollections() {
        for (let curSource in this.data) {
            let curSets = this.data[curSource].getSets();
            for (let curSet of curSets) {
                // Ignore empty sets
                if (!curSet)
                    continue;
                // Add all datasets if no distinguish attribute is defined
                if (!this.options.colAttribute) {
                    this.colDatasets.set('all', []);
                    this.colDatasets.get('all').push(curSet);
                    continue;
                }
                // Check if set has domainobjectAttribute
                let curDomainobjName = curSet[this.options.colAttribute];
                if (typeof curDomainobjName !== 'undefined') {
                    // Create domainobjectspace
                    if (!this.colDatasets.has(curDomainobjName))
                        this.colDatasets.set(curDomainobjName, []);
                    // Add set to domainobjects
                    this.colDatasets.get(curDomainobjName).push(curSet);
                }
            }
        }
    }

    calcAllDomains() {
        for (let curColName of this.colDatasets.keys()) {
            this.calcDomains(curColName);
        }
    }

    calcDomains(colName) {
        let domains = new Map();
        let constraints = new Map();
        let unairDone = false;
        let queue = [];
        queue.push(...this.colDatasets.get(colName));
        let setNo = 0;
        while (queue.length) {
            let curSet = queue.shift();
            // Exclude empty sets
            if (!curSet)
                continue;
            // Get constraint attributes
            let cattrs = this.getConstraintAttributes(curSet);
            // If curSet is unairy constraint
            if (cattrs.length > 2) {
                throw('Only unary and binary constraints are supported')
            } else if (cattrs.length === 0) {
                // If there are no attributes
                continue;
            } else if (!unairDone && cattrs.length === 2) {
                //TODO work on unary first
                //Only important if border values should be calculated from 
                //Values that are not bound in constraints (do not implement in prototype)
            }
            // Get or build constraint
            let constraint = null;
            if (cattrs.length === 2) {
                // Build constraint id
                let conId = cattrs[0] + '~' + cattrs[1];
                console.log('conID::::::');
                console.log(conId);
                constraint = constraints.get(conId);
                // Create constriant if not existend
                if (!constraint) {
                    constraint = new Constraint(conId);
                    constraints.set(conId, constraint);
                }
                // Note constraint function
                if (curSet.func)
                    constraint.setFunction(curSet.func);
            }

            // Iterate over attributes
            for (let curAttrNo in cattrs) {
                let curAttr = cattrs[curAttrNo];
                // Create variable in domains if not existend
                if (!domains.has(curAttr)) {
                    domains.set(curAttr, []);
                }
                let curDomain = domains.get(curAttr);

                // If value is a number check min and max
                if (!isNaN(curSet[curAttr])) {
                    // Range id
                    let rangeId = curAttr;
                    let partId;
                    if (cattrs.length > 1) {
                        if (curAttrNo < 1) {
                            partId = cattrs[1] + '_' + curSet[cattrs[1]];
                        } else {
                            partId = cattrs[0] + '_' + curSet[cattrs[0]];
                        }
                    }
                    rangeId = rangeId + '~' + partId;

                    // Search if range exists
                    let range;
                    for (let curRange of curDomain) {
                        if (curRange.id === rangeId) {
                            range = curRange;
                            break;
                        }
                    }
                    // If no range was found create new
                    if (!range) {
                        range = new NumericRange(rangeId);
                        curDomain.push(range);
                    }
                    // Update range
                    range.update(curSet[curAttr]);
                    // Update constriant
                    if (constraint)
                        constraint.addPossibleValue(curAttr, range, setNo);
                } else if (typeof curSet[curAttr] === 'object') {
                    let desc = 'object with ';
                    for (let curKey of Object.keys(curSet[curAttr])) {
                        desc += ',' + curKey + ' = ' + curSet[curAttr][curKey];
                    }
                    curDomain.push(desc);
                    if (constraint)
                        constraint.addPossibleValue(curAttr, curSet[curAttr], setNo);
                } else {
                    console.log('curAttr:');
                    console.log(curAttr);
                    console.log(typeof curSet[curAttr]);
                    //Checks on allready existing in list, only add new
                    for (let curPossible of curSet[curAttr].split(',')) {
                        curPossible = curPossible.trim();
                        console.log('--' + curPossible);
                        if (!curDomain.includes(curPossible)) {
                            curDomain.push(curPossible);
                        }
                        if (constraint) {
                            console.log(curAttr + ' - ' + curPossible + ' - ' + setNo);
                            constraint.addPossibleValue(curAttr, curPossible, setNo);
                        }
                    }
                }
            }
            setNo++;
        }

        console.log("Found domains:");
        console.log(domains);
        this.colDomains.set(colName, domains);

        console.log("Found constraints:");
        console.log(constraints);
        // REmove duplicates
        for (let curCon of constraints) {
            //TODO remove here existing string value in array
            console.log(curCon);
            if (curCon.removeDuplicateCombinations)
                curCon.removeDuplicateCombinations();
        }

        this.colConstraints.set(colName, constraints);

//        let shiftConstraint = null;
//        let parsedConstraints = [];
//        while ((shiftConstraint = constraints.shift()) !== undefined) {
//            console.log(shiftConstraint);
//            parsedConstraints.push(shiftConstraint);
//            let outAttrs = Object.keys(shiftConstraint);
//            if (outAttrs.length > 2) {
//                console.log('Constraints with more than 2 variables are not supported');
//                continue;
//            }
//            // Check integration into remaining constraints
//            for (let i = 0; i < constraints.length; i++) {
//                console.log('compare with:');
//                console.log(constraints[i]);
//
//                let inAttrs = Object.keys(constraints[i]);
//                // Exclude n>2 constraints
//                if (inAttrs.length > 2) {
//                    console.log('Constraints with more than 2 variables are not supported');
//                    continue;
//                }
//
//                let posibleChanges = 0;
//                let minCanBeLowered = new Map();
//                let maxCanBeUppered = new Map();
//                let valCanBeAdded = new Map();
//                // Compare shared attributes
//                for (let curAttr of outAttrs) {
//                    // Attr not included in target, goto next
//                    if (!constraints[i][curAttr])
//                        continue;
//                    // Check for list attr
//                    if (shiftConstraint[curAttr].values) {
//                        let addableValues = [];
//                        for (let curVal of shiftConstraint[curAttr].values) {
//                            if (!constraints[i][curAttr].values.includes(curVal)) {
//                                addableValues.push(curVal);
//                            }
//                        }
//                        if (addableValues.length > 0) {
//                            posibleChanges++;
//                            valCanBeAdded.set(curAttr, addableValues);
//                        }
//                    } else {
//                        // This is a numeric attr
//                        // Check if min can be lowered
//                        if (shiftConstraint[curAttr].min < constraints[i][curAttr].min) {
//                            minCanBeLowered.set(curAttr, shiftConstraint[curAttr].min);
//                            posibleChanges++;
//                        }
//                        // Check if max can be uppered
//                        if (shiftConstraint[curAttr].max > constraints[i][curAttr].max) {
//                            maxCanBeUppered.set(curAttr, shiftConstraint[curAttr].max);
//                            posibleChanges++;
//                        }
//                    }
//                }
//
//                // Only change if only one variable has to be extended
//                if (posibleChanges === 1) {
//
//                    for (const [minAttr, minValue] of minCanBeLowered.entries()) {
//                        constraints[i][minAttr].min = minValue;
//                    }
//                    for (const [maxAttr, maxValue] of maxCanBeUppered.entries()) {
//                        constraints[i][maxAttr].max = maxValue;
//                    }
//
//                    for (const [addAttr, addValues] of valCanBeAdded.entries()) {
//                        constraints[i][addAttr].push(...addValues);
//                    }
//
//                }
//
//            }
//        }
//        console.log('workedConstraints:');
//        console.log(parsedConstraints);
    }

    calculateConstraints() {
        for (let curSource in this.data) {
            let curSets = this.data[curSource].getSets();
            for (let curSet of curSets) {
                // Exclude empty sets
                if (!curSet)
                    continue;
                // Iterate over attributes
                for (let curAttr in curSet) {
                    // Exclude dataset attrs
                    if (curAttr === 'swac_fromName' || curAttr === 'isnew' || curSet[curAttr] === null)
                        continue;
                    // Exclude category attrs
                    if (curAttr === 'type')
                        continue;
                }
            }
        }
    }

    /**
     * Get the names of the constriant attributes.
     * 
     * @param {Object} set Dataset where to get the constraint attributes from
     * @returns {undefined}
     */
    getConstraintAttributes(set) {
        let attrs = Object.keys(set);
        let cattrs = [];
        for (let curAttr of attrs) {
            if (set[curAttr] !== null && curAttr !== this.options.colAttribute && !this.options.ignoredAttributes.includes(curAttr))
                cattrs.push(curAttr);
        }
        return cattrs;
    }
}


