import SWAC from '../../swac.js';
import Msg from '../../Msg.js';
import Model from '../../Model.js';
import Algorithm from '../../Algorithm.js';
import DomainCollection from './DomainCollection.js';
import CombinationConstraint from './constraints/CombinationConstraint.js';
import FunctionConstraint from './constraints/FunctionConstraint.js';
import NumericRange from './domainvalues/NumericRange.js';
import ObjectPlaceholder from './domainvalues/ObjectPlaceholder.js';
import SelectEntry from './domainvalues/SelectEntry.js';
import DomainValue from './domainvalues/DomainValue.js';
import ConstraintDataSetObserver from './ConstraintDataSetObserver.js';

/* 
 * ConstriantSolver algorithm and helping methods
 */
export default class ConstraintSolver extends Algorithm {

    /**
     * Constructs a new ConstraintSolver
     * 
     * @param {Object} options Object with options for constraint solver
     * 
     * @returns {ConstraintSolver}
     */
    constructor(options = {}) {
        super(options);
        this.name = 'ConstraintSolver';
        this.desc.text = 'Algorithm for checking constraints';

        this.desc.opts[0] = {
            name: "domainDefs",
            desc: "Definition of the domains including constraint definitions."
        };
        if (!options.domainDefs)
            this.options.domainDefs = [];

        this.desc.opts[1] = {
            name: "colAttribute",
            desc: "Name of the attribute that distinguish between collections of datasets"
        };
        if (!options.colAttribute)
            this.options.colAttribute = 'col';

        this.desc.opts[2] = {
            name: "ignoredAttributes",
            desc: "Array of attributes that should be ignored"
        };
        if (!options.ignoredAttributes)
            this.options.ignoredAttributes = ['id', 'swac_fromName', 'isnew', 'cat', 'func', 'draggable'];
        this.desc.opts[3] = {
            name: 'reportMode',
            desc: 'Mode of reporting constraint violations: exception | modal | func'
        };
        if (!options.reportMode)
            this.options.reportMode = new Map();
        this.desc.opts[4] = {
            name: 'reportFunction',
            desc: 'Function to execute, when a contraint is violated and the reportMode is on "func"'
        };
        if (!options.reportMode)
            this.options.reportFunction = null;

        // Internal attributes
        // Collections for definitions
        this.colDatasets = new Map();   // Key = Collection, value = List of Objects
        this.domainCollections = new Map(); // Key = Collection name, value = DomainCollection[]
        // Collections for parts. These are copied from domainCollections for each dataset
        // corosponding the name of the col attribute of the dataset
        this.partCollections = new Map(); // Key = fromName, value = DomainCollection[];
        this.constraintdatasetobserver = new Map();
    }

    init() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    // Part I - Transform definitions into domainCollections

    /**
     * Calculate the available collections
     */
    calcCollections() {
        for (let curSet of this.options.domainDefs) {
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

    /**
     * Calculate all available domains
     */
    calcAllDomainCollections() {
        for (let curColName of this.colDatasets.keys()) {
            this.calcDomainCollection(curColName);
        }
    }

    /**
     * Calculate domains for a specific collection
     * 
     * @param {String} colName Collection name
     */
    calcDomainCollection(colName) {
        // Get domainCollection
        let domainCollection = this.domainCollections.get(colName);
        if (!domainCollection) {
            domainCollection = new DomainCollection(this);
            this.domainCollections.set(colName, domainCollection);
        }

        for (let curSet of this.colDatasets.get(colName)) {
            // Store type for connection selection purposes
            domainCollection.collection_type = curSet.typ;
            for (let curKey of Object.keys(curSet)) {
                // Exclude attributes
                if (curKey.startsWith('swac_') || curSet[curKey] === null || curKey === this.options.colAttribute
                        || this.options.ignoredAttributes.includes(curKey))
                    continue;
                // Exclude non array values (those cant be definition)
                if (!Array.isArray(curSet[curKey])) {
                    continue;
                }
                // Interpret combinations
                if (curKey === 'combinations') {
                    for (let curCombi of curSet[curKey]) {
                        // Note possible values
                        let combiId = '';
                        for (let curAttr of Object.keys(curCombi)) {
                            this.addDomainValues(domainCollection, curAttr, curCombi[curAttr]);
                            combiId += curAttr;
                        }
                        // Check if an constraint with this id exists
                        let existingCon = null;
                        for (let searchCons of domainCollection.constraints.values()) {
                            for (let curSearchCon of searchCons) {
                                if (curSearchCon.id === combiId) {
                                    existingCon = curSearchCon;
                                    break;
                                }
                            }
                        }
                        if (existingCon !== null) {
                            existingCon.addCombination(curCombi);
                        } else {
                            // Note constraint
                            let curCon = new CombinationConstraint(combiId, curCombi);
                            let curConsts = domainCollection.constraints.get(curCon.variables[0]);
                            if (!curConsts) {
                                domainCollection.constraints.set(curCon.variables[0], []);
                            }
                            domainCollection.constraints.get(curCon.variables[0]).push(curCon);
                        }
                    }
                    continue;
                }
                // Interpret functional constraints
                if (curKey === 'functions') {
                    let i = 0;
                    for (let curFuncObj of curSet[curKey]) {
                        let curCon = new FunctionConstraint(curKey + i, curFuncObj);
                        let curConsts = domainCollection.constraints.get(curCon.variables[0] + '/' + curCon.variables[1]);
                        if (!curConsts) {
                            domainCollection.constraints.set(curCon.variables[0] + '/' + curCon.variables[1], []);
                        }
                        domainCollection.constraints.get(curCon.variables[0] + '/' + curCon.variables[1]).push(curCon);
                        i++;
                    }
                    continue;
                }
//                console.log('addDomainValues: ' + colName);
//                console.log(curKey);
//                console.log(curSet[curKey]);
                // Add simple values
                this.addDomainValues(domainCollection, curKey, curSet[curKey]);
            }
        }
    }

    /**
     * Converts values from DomainDefinition format to DomainValues
     */
    convertValue(curVal) {
        let newVal = null;
        // Handle ranges
        if (typeof curVal === 'object' && (Object.keys(curVal).includes('min') || Object.keys(curVal).includes('max'))) {
            newVal = new NumericRange(curVal.min, curVal.max);
        }
        // Handle dataobject placeholders
        else if (typeof curVal === 'object') {
            newVal = new ObjectPlaceholder(curVal);
        } else {
            newVal = new SelectEntry(curVal);
        }

        return newVal;
    }

    /**
     * Add an possible value to a domaincollection an variable.
     * 
     * @param {DomainCollection} domainCollection Collection where to add the value
     * @param {String} variable Name of the variable where to add
     * @param {Object[]} values List of values to add
     */
    addDomainValues(domainCollection, variable, values) {
        let existingVals = domainCollection.domains.get(variable);
        if (!existingVals) {
            existingVals = [];
            domainCollection.domains.set(variable, existingVals);
        }
        for (let curVal of values) {
            // Check if given value is a DomainValue, if not convert
            let newVal = curVal;
            if (!(newVal instanceof DomainValue)) {
                newVal = this.convertValue(newVal);
            }
            // Check if value is allready included
            if (newVal.type === 'SelectEntry') {
                // Check if selection entry is allready included
                if (existingVals.some(entry => entry.value === newVal.value))
                    continue;
            } else if (newVal.type === 'NumericRange') {
                //Check if range is allready included
                if (existingVals.some(range => range.min === newVal.min && range.max === newVal.max))
                    continue;
            }
            // Handle dataobject placeholders
            else if (newVal.type === 'ObjectPlaceholder') {
                //Check if dataobject placeholder is allready included
                if (existingVals.some(dataobject => dataobject[this.options.colAttribute] === newVal[this.options.colAttribute]))
                    continue;
            } else {
                Msg.error('ConstraintSolver', 'Unkown type >' + newVal.type + '< in addDomainValues() ', this.requestor);
                return;
            }
            //
            existingVals.push(newVal);
        }
    }

    // Part II: Set datasets

    /**
     * After a new dataset was added, add also a corosponding domainCollection
     * for that set to this.partCollections
     */
    afterAddSet(set) {
        Msg.flow('ConstraintSolver', 'Create PartCollection for >' + set.swac_fromName + '[' + set.id + ']<', this.requestor);
        // Check if set has needed col attribute
        if (!set.col) {
            Msg.error('ConstraintSolver', 'Given dataset >' + set.swac_fromName + '<['
                    + set.id + '] has not the required attribute >' + this.options.colAttribute + '<', this.requestor);
            return;
        }
        // Check if there is domainCollection for that type
        if (!this.domainCollections.has(set.col)) {
            Msg.error('ConstraintSolver', 'Given dataset >' + set.swac_fromName + '<['
                    + set.id + '] belongs to the unkown >'
                    + this.options.colAttribute + '< >' + set.col + '<', this.requestor);
            return;
        }
        // Create a copy of the domainCollection for that dataset
//        console.log(this.domainCollections);
//        console.log('domainCollection for ' + set.col);
//        console.log(this.domainCollections.get(set.col));
        let pc = this.domainCollections.get(set.col).copy();
        pc.set = set;
        // Create storage for source if not exists
        if (!this.partCollections.has(set.swac_fromName)) {
            this.partCollections.set(set.swac_fromName, []);
        }
        // Add domainCollection for dataset
        this.partCollections.get(set.swac_fromName)[set.id] = pc;

        // Create exepected attributes if not existend
        for (let curKey of pc.domains.keys()) {
            // Only register attributes name, do not change value
            if (typeof set[curKey] === 'undefined')
                set[curKey] = undefined;
        }

        // Create set watcher. Sets the occupancy when data changed
        if (!this.constraintdatasetobserver.has(set.swac_fromName))
            this.constraintdatasetobserver.set(set.swac_fromName, []);
        // Prevent double observe
        if (!this.constraintdatasetobserver.get(set.swac_fromName)[set.id]) {
            Msg.flow('ConstraintSolver', 'Create ConstraintDataSetObserver for >' + set.swac_fromName + '[' + set.id + ']<', this.requestor);
            let cdso = new ConstraintDataSetObserver(this, set);
            this.constraintdatasetobserver.get(set.swac_fromName)[set.id] = cdso;
        }
        // Run constraint solving
        for (let curAttr in set) {
            if (!curAttr.startsWith('swac_')) {
                this.checkConstraints(set.swac_fromName, set.id, curAttr);
            }
        }
    }

    /**
     * Sets a occupancy to the data. Also creates a new state, if statebuilding is active
     * 
     * @param {String} fromName Name of the collection where to set the value
     * @param {int8} setid Affected datasets id
     * @param {String} attr Name of the variable to set
     * @param {Object} value Value to set
     * @returns {Map<String,Object[]>} Map of Variable and Domains possible for the modified part
     */
    setOccupancy(fromName, setid, attr, value) {
//        Msg.flow('ConstraintSolver','   #### setOccupancy() for >' + fromName + '[' + setid + '].' + attr + '< to >' + value + '<',this.requestor);
        // Do not set value in this.data here, because that should allready be done
        // right before calling setOccupancy()

        // Get the matching partCollection
        let pcs = this.partCollections.get(fromName);
        if (!pcs) {
            Msg.error('ConstraintSolver', 'There are no domains for >' + fromName + '< to get PartCollections for.', this.requestor);
            return;
        }

        Msg.flow('ConstraintSolver', 'Set occupancy for >' + fromName + '[' + setid + '].' + attr + '< to: >' + value + '<');
        let pc = pcs[setid];
        if (!pc) {
            Msg.error('ConstraintSolver', 'Could not find partCollection for >' + fromName + '[' + setid + '].');
            console.log(pcs);
            return;
        }

        if (attr === this.options.colAttribute) {
            // Get now applicable domains
            let dcs = this.domainCollections.get(value);
            if (!dcs) {
                Msg.error('ConstraintSolver', 'There are no domains for >' + value + '< to get DomainCollections for.', this.requestor);
                return;
            }
            // Send information about changed domains
            for (let [curAttr, curDomain] of dcs.domains.entries()) {
                pc.setDomain(curAttr, curDomain);
                pc.notifyObservers(curAttr);
            }
        }

        let domVals = pc.domains.get(attr);
        if (domVals) {
//            console.log('domVals:');
//            console.log(domVals);
            // Check if value is valid
            let occuVals = [];
            for (let curDomVal of domVals) {
                if (curDomVal.type === 'SelectEntry') {
                    if (curDomVal.value === value)
                        occuVals.push(curDomVal);
                } else if (curDomVal.type === 'NumericRange') {
                    if (value >= curDomVal.min && value <= curDomVal.max) {
                        occuVals.push(curDomVal);
                    }
                } else if (curDomVal.type === 'ObjectPlaceHolder') {

                }
            }

            if (occuVals.length === 0) {
                switch (this.options.reportMode) {
                    case "exception":
                        throw 'Occupancy with >' + value + '< for attribute >' + attr
                                + '< is not allowed. Allowed values are: >' + domVals + '<';
                        break;
                    case "modal":
                        alert('Constraint violation: The value ' + value + ' on ' + attr + ' is not allowed.');
                        // Folowing methodcall leads to endless recurssion
                        //UIkit.modal.alert('Constraint violation');
                    case "func":
                        this.options.reportFunction(pc, attr, value);
                        return;
                }
            }
        }

        // Check constraints
        let valid = this.checkConstraints(fromName, setid, attr);
        if (!valid)
            throw 'The selected value >' + value + '< violates a constraint.';

        // Do not narrow domain here! Domain can only be narrowed by constriants
        // Real occupancy is stored in daaset (this.data)
        //this.domains.set(attr,occuVals);
    }

    // PART III: Check constraints

    /**
     * Gets copies of all constriants where the given variable is involved
     * 
     * @param {DomainCollection} dc DomainCollection where to get constraints from
     * @param {String} attr Name of the variable that should be infvolved
     */
    getConstraintCopiesForAttr(dc, attr) {
        Msg.flow('ConstraintSolver', '   #### getConstraintCopiesForAttr >' + attr + '<', this.requestor);
        let consts = [];
        for (let curConstList of dc.constraints.values()) {
//            console.log('constraintList:');
//            console.log(curConstList);
            for (let curConst of curConstList) {
                if (curConst.variables.includes(attr)) {
                    // Firsty copy with original direction A -> B
                    let abCons = curConst.copy();
                    abCons.pc = dc;
                    consts.push(abCons);
//                    console.log('AB copy const:');
//                    console.log(abCons);
                    // Second copy for check of other direction B -> A
                    let baCons = abCons.copy();
                    baCons.variables[0] = abCons.variables[1];
                    baCons.variables[1] = abCons.variables[0];
                    consts.push(baCons);
//                    console.log('BA copy const:');
//                    console.log(baCons);
                }
            }
        }
        return consts;
    }

    /**
     * Get costraints effecting the connection of two parts.
     * 
     * @param {DomainCollection} pc PartCollection of one of the partners
     * @param {String} attr Attribute to check on for costraint
     */
    getConnectionConstraints(pc, attr) {
        let consts = [];
        Msg.flow('ConstraintSolver', '   #### getConnectionConstraints() for attribute >' + attr + '<', this.requestor);
        if (SWAC.config.debugmode) {
            console.log('   Given DomainCollection:');
            console.log(pc);
        }
        let parentPc;
        let changedAttr;
        if (pc.set.swac_fromName === this.options.mainSource) {
            parentPc = pc;
            changedAttr = 'parent.' + attr;
        } else if (pc.set[this.options.parentIdAttr]) {
            let parentRef = pc.set[this.options.parentIdAttr];
            if (typeof parentRef === 'number') {
                let pcs = this.partCollections.get(this.options.mainSource);
                parentPc = pcs[parentRef];
            } else if (parentRef) {
                let parentFromName = Model.getSetnameFromReference(parentRef);
                let parentId = Model.getIdFromReference(parentRef);
                let pcs = this.partCollections.get(parentFromName);
                if (!pcs) {
                    Msg.error('ConstraintSolver', 'There are no partCollections for >'
                            + parentFromName + '< to check connection constraints.', this.requestor);
                    return consts;
                }
                parentPc = pcs[parentId];
            }
            changedAttr = 'child.' + attr;
        } else {
            Msg.warn('ConstraintSolver', 'The domain collection is not of a '
                    + 'mainSource nor has the attribute >' + this.options.parentAttr
                    + '< to get identified as child. So there couldnt checked on connection constraints.',
                    this.requestor);
        }

        if (!parentPc) {
            Msg.flow('ConstriantSolver', 'There was no parent PartCollection found.'
                    + ' So there could no connection constraints for set >'
                    + pc.set.swac_fromName + '[' + pc.set.id + ']<', this.requestor);
            return consts;
        }
        if (SWAC.config.debugmode) {
            console.log('   Identified parent PartCollection:');
            console.log(parentPc);
        }

        // Get list of child partCollection
        let childPcs = [];
        for (let curPcs of this.partCollections.values()) {
            for (let curPc of curPcs) {
                if (!curPc)
                    continue;
                if (curPc.set[this.options.parentIdAttr] === parentPc.set.id) {
                    childPcs.push(curPc);
                }
            }
        }
        if (childPcs.length === 0) {
            Msg.warn('ConstraintSolver', 'There are no childs found for dataset >'
                    + parentPc.set.swac_fromName + '[' + parentPc.set.id + ']< '
                    + 'useing options.parentIdAttr >' + this.options.parentIdAttr + '<', this.requestor);
        }
        // Search domain collection applicable on connections
        for (let [colName, connectionDc] of this.domainCollections) {
            if (!colName.includes('Verbindung'))
                continue;
            Msg.flow('ConstraintSolver', '   + Check connection domainCollection >' + colName + '<');
//            console.log('   Check if DomainCollection >' + colName + '< effects attribute >' + changedAttr + '<');
//            console.log(connectionDc);
//            if (!connectionDc.constraints.has(changedAttr))
//                continue;
//            console.log('connectionDc contains attr: ' + changedAttr);
//            console.log('condc: ' + i);
//            console.log(connectionDc);
            // Check if parent partCollection is applicable
            Msg.flow('ConstraintSolver', '     Check if partCollection ' + parentPc.set.swac_fromName + '[' + parentPc.set.id + '] is applicable as parent', this.requestor);
            if (!this.checkPCMatchCond(parentPc, connectionDc.domains.get('parent')))
                continue;

            for (let curChildPc of childPcs) {
                Msg.flow('ConstraintSolver', '     Check if partCollection ' + curChildPc.set.swac_fromName + '[' + curChildPc.set.id + '] is applicable as child', this.requestor);
                if (this.checkPCMatchCond(curChildPc, connectionDc.domains.get('child'))) {
                    Msg.flow('ConstraintSolver', '     partCollection is applicable. Now order parent / child mechanism', this.requestor);
                    let cc = this.getConstraintCopiesForAttr(connectionDc, changedAttr);
                    let broken = false;
                    for (let curCC of cc) {
                        let childVar;
                        let parentVar;
                        let col;
                        if (curCC.variables[0].startsWith('child.')) {
                            childVar = curCC.variables[0];
                            parentVar = curCC.variables[1];
                            col = parentPc.set.col;
                        } else {
                            childVar = curCC.variables[1];
                            parentVar = curCC.variables[0];
                            col = curChildPc.set.col;
                        }
                        childVar = childVar.replace('child.', '');
                        parentVar = parentVar.replace('parent.', '');
                        // Check if attribute does not exits - then no need to check constraint
                        if (!parentPc.domains.get(parentVar)) {
                            Msg.warn('ConstraintSolver', '     No need to check constraint because >' + parentVar + '< not existend in parent.', this.requestor);
                            broken = true;
                        }
//                        if (!curChildPc.domains.get(childVar) && curChildPc.set[childVar] !== 'undefined') {
//                            //Auto create domain
//                            curChildPc.domains.set(childVar,[new SelectEntry(curChildPc.set[childVar])]);
//                        } else
                        if (!curChildPc.domains.get(childVar)) {
                            Msg.warn('ConstraintSolver', '     No need to check constraint because >' + childVar + '< not existend in child.', this.requestor);
                            if (SWAC.config.debugmode)
                                console.log(curChildPc);
                            broken = true;
                        }
                        if (broken)
                            break;

                        curCC.parentPc = parentPc;
                        curCC.childPc = curChildPc;
                        curCC.pc = connectionDc.copy();
                        curCC.pc.domains = new Map();
                        curCC.pc.domains.set("parent." + parentVar, parentPc.domains.get(parentVar));
                        curCC.pc.domains.set("child." + childVar, curChildPc.domains.get(childVar));
                        curCC.pc.set = {
                            col: col
                        };
                        curCC.pc.set["parent." + parentVar] = parentPc.set[parentVar];
                        curCC.pc.set["child." + childVar] = curChildPc.set[childVar];
                    }
                    if (!broken)
                        consts.push(...cc);
                }
            }
        }
        return consts;
    }

    /**
     * Checks if a partCollection is matching given conditions
     * 
     * @param {DomainCollection} pc DomainCollection as partCollection of a object involved in ConstraintSolveing
     * @param {Object} conds Object with attributes that must be available and of same value in the partCollections set
     */
    checkPCMatchCond(pc, conds) {
        Msg.flow('ConstraintSolver', '      + Check partCollection ' + pc.set.swac_fromName + '[' + pc.set.id + '] matches conditions', this.requestor);
        let matching = true;
        //TODO implement check as interpretation "OR" currently is "AND"
        for (let curCond of conds) {
            let curDef = curCond.def;
            for (let curVar in curDef) {
//                Msg.info('ConstraintSolver','      Variable >' + curVar + '< should be >' + curDef[curVar] + '<', this.requestor);
                if (curVar === 'typ' && pc.collection_type !== curDef[curVar]) {
                    Msg.warn('ConstraintSolver', '        PartCollection does not match type >' + curDef[curVar] + '< is >' + pc.collection_type + '<', this.requestor);
                    matching = false;
                    break;
                } else if (curVar !== 'typ' && pc.set[curVar] !== curDef[curVar]) {
                    Msg.warn('ConstraintSolver', '        Variable ' + curVar + ' does not has expected value >' + curDef[curVar] + '<', this.requestor);
                    matching = false;
                    break;
                } else {
                    Msg.info('ConstraintSolver', '        Variable ' + curVar + ' matches >' + curDef[curVar] + '<', this.requestor);
                }
            }
        }
        return matching;
    }

    checkConstraints(fromName, setid, attr) {
        if (this.options.ignoredAttributes.includes(attr)) {
            return true;
        }

        if (SWAC.config.debugmode) {
            console.log('*********************************************************');
            console.log('      START CONSTRAINT CHECK for ' + fromName + '[' + setid + '].' + attr);
            console.log('*********************************************************');
        }
        // Get the matching partCollection
        // 1.	Wähle die Variable (A), deren Belegung zuletzt geändert wurde
        // 2.	Wähle die Domänen-Kollektion, die zu dem Objekt passt, dessen Variable geändert wurde
        let pcs = this.partCollections.get(fromName);
        if (!pcs) {
            Msg.error('ConstraintSolver', 'There are no domains for >' + fromName + '< to get DomainCollections for.', this.requestor);
            return false;
        }
        let pc = pcs[setid];
        if (SWAC.config.debugmode)
            console.log(pc);
        // Do not check dragged objects to avoid heavy checking
        if (pc.set.swac_dragged) {
            Msg.flow('ConstraintSolver', 'Do not run ConstraintSolver to avoid heavy checking', this.requestor);
            return true;
        }
        // Get constraints
        // 3.	Sammle alle Constraints, die die Variable betreffen aus der Domänen-Kollektion
        if (SWAC.config.debugmode) {
            console.log('CONSTRAINTS:');
            console.log(pc.constraints);
            console.log('DOMAINS:');
            console.log(pc.domains);
        }

        if (pc.domains.size === 0) {
            Msg.warn('ConstraintSolver', 'Dataset >' + fromName + '[' + setid + ']< has no domains.', this.requestor);
            return true;
        }

        //Copy constraints (because otherwise they would be deleted from domain)
        let constQueue = this.getConstraintCopiesForAttr(pc, attr);
        //Get constraints between parts
        constQueue.push(...this.getConnectionConstraints(pc, attr));

        // Check if there is a constraint involved in the attribute
        if (constQueue.length === 0) {
            Msg.info('ConstraintSolver', 'Variable >' + attr + '< is not involved in constraints.', this.requestor);
            return true;
        }

        // 5.	Solange die Queue nicht leer ist:
        while (constQueue.length > 0) {
            if (SWAC.config.debugmode)
                console.log('Remaining constraints: ' + constQueue.length);
            // 1.	Entferne den Constraint aus der Queue
            let curConst = constQueue.shift();
            // 2.	Prüfe die Einhaltung des Constraints (Revise s.u.)
            if (curConst && this.revice(curConst)) {
                // Remove null entries (not deleted within revice because of paralel working)
//                for (let i in dc.domains.get(curConst.variables[0])) {
//                    if (dc.domains.get(curConst.variables[0])[i] == null) {
//                        dc.domains.get(curConst.variables[0]).splice(i);
//                    }
//                }
                if (SWAC.config.debugmode) {
                    console.log('Domain for >' + curConst.variables[0] + '< was narrowed by constraint >' + curConst.id + '<');
                    console.log('Remaining possibilties: ' + curConst.pc.domains.get(curConst.variables[0]));
                }
                // 1. Ist die Domäne der aktuellen Variable leer ist das Problem nicht lösbar
                if (curConst.pc.domains.get(curConst.variables[0]).length === 0) {
                    // Problem not solveable
                    Msg.error('ConstraintSolver', 'Constraint >' + curConst.id
                            + '< is violated by the values '
                            + curConst.variables[0] + ' = >' + curConst.pc.set[curConst.variables[0]]
                            + '< and ' + curConst.variables[1] + ' = >' + curConst.pc.set[curConst.variables[1]] + '<'
                            , this.requestor);
                    if (SWAC.config.debugmode)
                        console.log(curConst.pc);
                    return false;
                } else {
                    if (SWAC.config.debugmode) {
                        console.log('remaining constraints before adding new ones:');
                        console.log(constQueue.length);
                    }
                    // Re add constraints for next check
                    constQueue.push(...this.getConstraintCopiesForAttr(pc, curConst.variables[0]));
                    //Get constraints between parts
                    constQueue.push(...this.getConnectionConstraints(pc, curConst.variables[0]));
                    if (SWAC.config.debugmode)
                        console.log('Found constraints that effect variable >' + curConst.variables[1] + '<: ' + constQueue.length);
                    // Remove duplicates
                    let foundids = [];
                    for (let i in constQueue) {
                        let curConst = constQueue[i];
                        if (!curConst)
                            continue;
                        if (foundids.includes(curConst.id)) {
                            delete constQueue[i];
                        } else {
                            foundids.push(curConst.id);
                        }
                    }
                    if (SWAC.config.debugmode) {
                        console.log('Constraints to check now (after remove duplicates):');
                        console.log(constQueue.length);
                    }
                }
            }
        }

        return true;
    }

    /**
     * Revice step of ACE3. Checks the constraint
     * 
     * @param {Constraint} cons Constraint to check
     * @param {PartCollection} pc Actual collection of the part
     * @return {bool} true if domain was changed
     */
    revice(cons) {
        let aVals = cons.pc.domains.get(cons.variables[0]);
        let aValue = cons.pc.set[cons.variables[0]];
        if (SWAC.config.debugmode) {
            console.log('====== REVICE for constraint ' + cons.id + ' =======');
            console.log('A = >' + cons.variables[0] + '<; B = >' + cons.variables[1] + '<');
            console.log('   partcollection:');
            console.log(cons.pc);
            console.log('   domain for variable A: ' + cons.variables[0]);
            console.log(aVals);
            console.log('   value for variable A: ' + cons.variables[0]);
            console.log(aValue);
        }
        // Do not narrow aVals: No selection of A makes a change to the posibilities 
        // of A without constraint from B

        // Get all original possibilites from B, because domains can be widened too
        let domainColTpl = this.domainCollections.get(cons.pc.set.col);
        if (!domainColTpl) {
            Msg.error('ConstraintSolver', 'No DomainCollection defined for >' + cons.pc.set.col + '<', this.requestor);
            return false;
        }
        let bVals = domainColTpl.domains.get(cons.variables[1].replace('child.', '').replace('parent.', ''));
        // DEV note: Beim Standard Constriant-Solving kann auf die weitere 
        // Prüfung verzichtet werden, wenn A keinen Wert besitzt. Dann muss B 
        // garantiert nicht eingeschränkt werden. Hier kann A jedoch zuvor 
        // einen Wert besessen haben und deshalb muss geprüft werden, um die 
        // Domäne ggf. wieder zu erweitern.
        let bValue = cons.pc.set[cons.variables[1]];
        if (SWAC.config.debugmode) {
            console.log('   domain for variable B:' + cons.variables[1]);
            console.log(bVals);
            console.log('   value for variable B:' + cons.variables[1]);
            console.log(bValue);
        }

        // If there is a value narrow domain
        if (typeof bValue !== 'undefined' && bValue !== null) {
            bVals = this.filterDomain(bVals, bValue, cons.variables[1]);
        } else {
            if (SWAC.config.debugmode)
                console.log('   no value set for B >' + cons.variables[1] + '<, so there can not be a narrowing on A >' + cons.variables[0] + '<');
            return false;
        }

        if (cons.combinations)
            return this.reviceCombination(cons, cons.pc, aVals, aValue, bVals, bValue);
        if (cons.func)
            return this.reviceFunction(cons, cons.pc, aVals, aValue, bVals, bValue);
    }

    /**
     * Revice step for combination constraints
     * 
     * @param {Constraint} cons Constraint of type CombinationConstraint
     * @param {DomainCollection} pc DomainCollection as partCollection
     */
    reviceCombination(cons, pc, aVals, aValue, bVals, bValue) {
        if (SWAC.config.debugmode) {
            console.log('### REVICE FOR COMBINATION ###');
            console.log('   constraint:');
            console.log(cons);
        }

        let aSelectables = [];
        for (let curValB of bVals) {
            if (curValB == null) {
                // Prev deleted
                continue;
            }
            for (let curComb of cons.combinations) {
                if (SWAC.config.debugmode) {
                    console.log('      Check if combination:');
                    console.log(curComb);
                    console.log('      is applicable for domainValue (B):');
                    console.log(curValB);
                    console.log('      is applicable if contained in:');
                    console.log(curComb[cons.variables[1]]);
                }
                let bFound = false;
                if (curValB.type && curValB.type === 'NumericRange') {
                    //Includes for NumericRange
                    for (let curCombVal of curComb[cons.variables[1]]) {
                        if (curCombVal.min === curValB.min && curCombVal.max === curValB.max) {
                            bFound = true;
                        }
                    }
                } else if (curValB.type && curValB.type === 'SelectEntry') {
                    // Includes for SelectEntry
                    for (let curCombVal of curComb[cons.variables[1]]) {
                        if (curCombVal === curValB.value) {
                            bFound = true;
                        }
                    }
                } else {
                    Msg.error('ConstraintSolver', 'Unknown value type >' + curValB.type + '< for curValA', this.requestor);
                }
                if (bFound) {
                    if (SWAC.config.debugmode)
                        console.log('      = is applicable');
                    aSelectables.push(...curComb[cons.variables[0]]);
                } else if (SWAC.config.debugmode) {
                    console.log('      = not applicable');
                }
            }
        }
        return this.narrowDomain(cons, aSelectables, aVals, pc)
    }

    /**
     * Revice step for function constraint
     * 
     * @param {Constraint} cons Constraint of type FunctionConstraint
     * @param {DomainCollection} pc DomainCollection as partCollection
     */
    reviceFunction(cons, pc, aVals, aValue, bVals, bValue) {
        Msg.flow('ConstriantSolver', '### REVICE FOR FUNCTION ###', this.requestor);

        let parentCpy = cons.parentPc.set.copy();
        let childCpy = cons.childPc.set.copy();

        let parentVar;
        let childVar;
        let aValOn;
        let bValOn;
        let narrowOn;
        if (cons.variables[0].startsWith('parent.')) {
            parentVar = cons.variables[0].replace('parent.', '');
            childVar = cons.variables[1].replace('child.', '');
            let domainColTpl = this.domainCollections.get(cons.parentPc.set.col);
            aVals = domainColTpl.domains.get(cons.variables[0].replace('parent.', ''));
            aValOn = parentCpy;
            bValOn = childCpy;
            narrowOn = cons.parentPc;
        } else {
            parentVar = cons.variables[1].replace('parent.', '');
            childVar = cons.variables[0].replace('child.', '');
            let domainColTpl = this.domainCollections.get(cons.childPc.set.col);
            aVals = domainColTpl.domains.get(cons.variables[0].replace('child.', ''));
            aValOn = childCpy;
            bValOn = parentCpy;
            narrowOn = cons.childPc;
        }

        let aSelectables = [];
        for (let curValB of bVals) {
            // Prev deleted
            if (curValB == null)
                continue;
            Msg.flow('ConstraintSolver', '    check if B >' + parentVar + '< with >' + curValB + '< is useable with:', this.requestor);

            bValOn[parentVar] = curValB.value;
            for (let curValA of aVals) {
                let use = 'not useable';
                aValOn[childVar] = curValA.value;
                // Check constraint with function
                if (cons.func(parentCpy, childCpy)) {
                    aSelectables.push(curValA);
                    use = 'useable';
                }
                Msg.flow('ConstriantSolver', '      A >' + childVar + '< with >' + curValA + '< is ' + use);
            }
        }

//        if (aValue && !aSelectables.includes(aValue)) {
//            console.log('Constraint violation!');
//        }

        this.narrowDomain(cons, aSelectables, aVals, narrowOn);
    }

    narrowDomain(cons, aSelectables, aVals, pc) {
        // Make values unique
        aSelectables = [...new Set(aSelectables)];

        if (SWAC.config.debugmode) {
            console.log('      now are the following possibilites for A >' + cons.variables[0] + '< allowed:');
            console.log(aSelectables);
        }
        let varname = cons.variables[0].replace('child.','').replace('parent.','');
        let prevSlectable = pc.domains.get(varname).length;
        // Check if domain for A has to be narrowed
        if (aSelectables.length != prevSlectable) {
            if (aSelectables.length < prevSlectable)
                Msg.info('ConstraintSolver', '      A >' + cons.variables[0] + '< has to be narrowed.', this.requestor);
            else
                Msg.info('ConstraintSolver', '      A >' + cons.variables[0] + '< has to be widened.', this.requestor);
            let domainColTpl = this.domainCollections.get(pc.set.col);
            if (SWAC.config.debugmode) {
                console.log(domainColTpl);
                console.log(cons.variables[0].replace('parent.', '').replace('child.', ''));
            }
            let aValsOrig = domainColTpl.domains.get(cons.variables[0].replace('parent.', '').replace('child.', ''));
            if (SWAC.config.debugmode)
                console.log(aValsOrig);
            // Restore DomainValue objects if needed
            for (let i in aSelectables) {
                if (typeof aSelectables[i] === 'string') {
                    aSelectables[i] = aValsOrig.find(function (domainvalue, index) {
                        return domainvalue.value === aSelectables[i];
                    });
                } else if (aSelectables[i].min) {
                    aSelectables[i].type = 'NumericRange';
                }
            }
            pc.setDomain(cons.variables[0].replace('parent.', '').replace('child.', ''), aSelectables);
            return true;
        } else if (SWAC.config.debugmode) {
            // NOTE: If aSelectables.length > aVals.length there would be possiblities added
            // but scince if one constraints narrow the possibilites, no other should enlarge them
            // so the domain remains unchanged
            console.log('      A >' + cons.variables[0] + '< stays unchanged.');
        }
        return false;
    }

    /**
     * Filters the given domain to posibilities, that are compatible with the given value.
     * 
     * @param {DomainValue[]} domain List of possibilities
     * @param {Object} occu Occupancy value where possibilites must be compatible with
     * @param {String} variable Variables name
     */
    filterDomain(domain, occu, variable) {
        Msg.flow('ConstraintSolver', 'Filter domain B >' + variable + '< values for >' + occu + '<');
        let newdomain = [];
        // Find the domainvalues that ar compatible to the value
        for (let curDomVal of domain) {
            if (curDomVal == null) {
                // Was prev deleted
                continue;
            }
            if (curDomVal.type && curDomVal.type === 'NumericRange') {
                let comp = 'incompatible';
                if (occu >= curDomVal.min && occu <= curDomVal.max) {
                    newdomain.push(curDomVal);
                    comp = 'compatible';
                }
                Msg.info('ConstraintSolver', 'Value >' + curDomVal + '< is ' + comp + ' with occupancy >' + occu + '<')
            } else if (curDomVal.type && curDomVal.type === 'SelectEntry') {
                let comp = 'incompatible';
                if (occu === curDomVal.value) {
                    newdomain.push(curDomVal);
                    comp = 'compatible';
                }
                Msg.info('ConstraintSolver', 'Value >' + curDomVal + '< is ' + comp + ' with occupancy >' + occu + '<')
            } else {
                Msg.error('ConstraintSolver', 'Unknown value type >' + curDomVal.type + '< for narrowDomain', this.requestor);
            }
        }
        return newdomain;
    }

    /**
     * Checks if all objects in this constriantsolver are complete
     */
    isComplete() {
        for (let [fromName, cols] of this.partCollections) {
            for (let curCol of cols) {
                if (curCol && !curCol.isComplete())
                    return false;
            }
        }
        return true;
    }

    /**
     * Gets a map for all datasources with 
     */
    getIncomplete() {
        let incompletes = new Map();
        for (let [fromName, cols] of this.partCollections) {
            for (let curCol of cols) {
                if (curCol && !curCol.isComplete()) {
                    // Create entry in map if not exists
                    if (!incompletes.has(fromName)) {
                        incompletes.set(fromName, []);
                    }
                    // Add missing information
                    incompletes.get(fromName)[curCol.set.id] = curCol.getIncomplete();
                }
            }
        }
        return incompletes;
    }

    // PART IV: Get definitions from domains

    /**
     * Gets the current valid definitions for the given set.
     * 
     * @param {String} fromName Name of the datasource
     * @param {int} setid Id of the dataset to look at
     * 
     * @returns {Map<String,Definition>} Map of definitions for attributes in dataset
     */
    getDataDefinitionsForSet(fromName, setid) {
        if (SWAC.config.debugmode) {
            console.log('--------------------');
            console.log('getDataDefinitionsForSet: ' + fromName + ' ' + setid);
        }
        let partCol = this.partCollections.get(fromName);
        if (!partCol) {
            Msg.error('ConstraintSolver', 'There are no CSDs for source >' + fromName + '<', this.requestor);
            return;
        }
        let dcs = partCol[setid];
        let defs = new Map();
        if (SWAC.config.debugmode) {
            console.log('dcs:');
            console.log(dcs);
        }
        for (let curAttr of dcs.domains.keys()) {
            defs.set(curAttr, this.getDataDefinitionsForSetAttr(fromName, setid, curAttr));
        }
        return defs;
    }

    /**
     * Gets the current valid definitions for the named attribute an the given set.
     * 
     * @param {String} fromName Name of the datasource
     * @param {int} setid Id of the dataset to look at
     * @param {String} attr Name of the attribute to look at
     */
    getDataDefinitionsForSetAttr(fromName, setid, attr) {
        Msg.flow('ConstraintSolver', 'getDataDefinitionsForSetAttr: ' + fromName + '[' + setid + '].' + attr, this.requestor);
        let dcs = this.partCollections.get(fromName);
        if (!dcs) {
            Msg.error('ConstraintSolver', 'There are no domains for >' + fromName + '< to get DomainCollections for.', this.requestor);
            return;
        }
        let dc = this.partCollections.get(fromName)[setid];
        if(!dc) {
            Msg.error('ConstraintSolver','There is no partCollection for >' + fromName + '[' + setid + ']<', this.requestor);
            return;
        }
        let attrdoms = dc.domains.get(attr);
        if (!attrdoms || attrdoms.length === 0)
            return null;
        let type = attrdoms[0].type;
        let def = {
            name: attr
        };

        if (type === 'NumericRange') {
            def.type = 'int4';
            def.min = 9999999999;
            def.max = -9999999999;
            for (let curAttrdom of attrdoms) {
                if (curAttrdom == null)
                    continue;
                if (curAttrdom.min < def.min) {
                    def.min = curAttrdom.min;
                }
                if (curAttrdom.max > def.max) {
                    def.max = curAttrdom.max;
                }
            }
        } else if (type === 'SelectEntry') {
            def.type = 'string';
            def.possibleValues = [];
            for (let curAttrdom of attrdoms) {
                if (curAttrdom == null)
                    continue;
                def.possibleValues.push(curAttrdom.value);
            }
        } else if (type === 'ObjectPlaceholder') {
            //TODO for connections
        } else {
            Msg.error('ConstraintSolver', 'DomainValues of type >' + type
                    + '< are currently not supported for transfering into definitions.');
        }
        return def;
    }

    includes(fromName, setid) {
        let pc = this.partCollections.get(fromName);
        if (!pc)
            return false;
        if (!pc[setid])
            return false;
        return true;
    }
}
