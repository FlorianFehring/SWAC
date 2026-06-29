import SWAC from '../../swac.js';
import Datafilter from '../Datafilter/Datafilter.js';
import Msg from '../../Msg.js';

/**
 * DataFilterStored component.
 *
 * Extends the Datafilter component with two features:
 * - the created filters are stored in the browsers localStorage and restored
 *   automatically, so they survive a page reload and can be reused when the
 *   user switches to another table
 * - every filter has a remove button so the user can delete single filters and
 *   get all data back
 *
 * The component starts without any filter. The user creates all filters
 * himself. The whole filtering logic stays in the Datafilter base class, this
 * class only adds persistence and removal.
 *
 * Because the selectable attributes are detected from the data, this component
 * works with any datasource (sensor data, water data, ...) without configuration.
 */
export default class DataFilterStored extends Datafilter {

    constructor(options = {}) {
        super(options);
        this.name = 'DataFilterStored';
        this.desc.text = 'Datafilter that stores its filters in localStorage and allows removing single filters.';
        this.desc.developers = 'Maczap (HSBI)';
        this.desc.license = 'GNU Lesser General Public License';

        // Use an own template that adds a remove button per filter
        this.desc.templates[0] = {
            name: 'datafilterstored',
            style: false,
            desc: 'Template with a remove button for every filter.'
        };

        this.desc.opts[10] = {
            name: 'storageKey',
            desc: 'Key under which the filters are stored in localStorage. If not set a key is built from the original datasource name so different tables keep their own filters.',
            example: 'myfilters'
        };
        if (!options.storageKey)
            this.options.storageKey = null;

        this.desc.opts[11] = {
            name: 'sharedStorageKey',
            desc: 'If true the same filters are used for all tables. If false every table (originalDataRequestor.fromName) keeps its own filters.',
            example: false
        };
        if (typeof options.sharedStorageKey === 'undefined')
            this.options.sharedStorageKey = false;

        this.desc.opts[12] = {
            name: 'filterSource',
            desc: 'Name of the datasource that holds the filter definitions. A fixed name so filters can be added even before any filter exists.',
            example: 'filters'
        };
        if (!options.filterSource)
            this.options.filterSource = 'filters';

        // Flag so the stored filters are only restored once
        this.filtersRestored = false;
    }

    /**
     * Builds the key under which the filters are stored. When sharedStorageKey
     * is false the original datasource name is part of the key, so every table
     * keeps its own set of filters.
     *
     * @returns {String} The storage key
     */
    buildStorageKey() {
        if (this.options.storageKey)
            return this.options.storageKey;
        let base = 'swac_datafilterstored';
        if (!this.options.sharedStorageKey && this.options.originalDataRequestor) {
            return base + '_' + this.options.originalDataRequestor.fromName;
        }
        return base;
    }

    /**
     * Loads the stored filters from localStorage.
     *
     * @returns {Array} Array of filter objects, empty when nothing is stored
     */
    loadStoredFilters() {
        try {
            let raw = localStorage.getItem(this.buildStorageKey());
            if (!raw)
                return [];
            let parsed = JSON.parse(raw);
            if (Array.isArray(parsed))
                return parsed;
            return [];
        } catch (e) {
            Msg.error('DataFilterStored', 'Could not read stored filters: ' + e, this.requestor);
            return [];
        }
    }

    /**
     * Writes the current filters to localStorage. Only the filter definition is
     * stored (name, desc, attr, type, values), not the swac internal attributes.
     *
     * @returns {undefined}
     */
    saveFilters() {
        let filters = [];
        for (let curSource in this.data) {
            for (let curSet of this.data[curSource].getSets()) {
                if (!curSet)
                    continue;
                filters.push({
                    name: curSet.name,
                    desc: curSet.desc,
                    attr: curSet.attr,
                    type: curSet.type,
                    values: curSet.values
                });
            }
        }
        try {
            localStorage.setItem(this.buildStorageKey(), JSON.stringify(filters));
        } catch (e) {
            Msg.error('DataFilterStored', 'Could not store filters: ' + e, this.requestor);
        }
    }

    /**
     * Restores the stored filters once the original data is loaded, so the
     * attribute select can be filled correctly. Uses the base classes addSet to
     * recreate every stored filter.
     *
     * @returns {undefined}
     */
    restoreStoredFilters() {
        if (this.filtersRestored)
            return;
        this.filtersRestored = true;

        let stored = this.loadStoredFilters();
        if (stored.length === 0)
            return;

        // Find the datasource name used for the filter sets
        let sourcename = this.getFilterSourceName();

        for (let curFilter of stored) {
            this.addSet(sourcename, curFilter);
        }
    }

    /**
     * Determines the name of the datasource that holds the filter sets.
     * Uses a fixed configurable name so filters can be added even when no
     * filter exists yet.
     *
     * @returns {String} Source name for the filter sets
     */
    getFilterSourceName() {
        return this.options.filterSource;
    }

    /**
     * Overrides onClickAddFilter so a new empty filter is always added to the
     * fixed filter source. The base implementation reads the source name from
     * this.data which is empty before the first filter exists.
     *
     * @param {Event} evt Click event from the add button
     * @returns {undefined}
     */
    onClickAddFilter(evt) {
        evt.preventDefault();
        this.addSet(this.getFilterSourceName(), {});
    }

    /**
     * Overrides loadOriginalData so the stored filters are restored as soon as
     * the original data and its attributes are available.
     *
     * @returns {undefined}
     */
    loadOriginalData() {
        let thisRef = this;
        // Listen once for the event the base class fires when data is loaded
        document.addEventListener('swac_' + this.requestor.id + '_datafilter_originalloaded', function onLoaded() {
            document.removeEventListener('swac_' + thisRef.requestor.id + '_datafilter_originalloaded', onLoaded);
            thisRef.restoreStoredFilters();
        });
        // Run the original loading
        super.loadOriginalData();
    }

    /**
     * Overrides afterAddSet to add the remove button and to store the filters
     * whenever a filter was added.
     *
     * @param {WatchableSet} set The filter set
     * @param {Array} repeateds Repeated dom elements for the filter
     * @returns {undefined}
     */
    afterAddSet(set, repeateds) {
        // Let the base class wire the attribute, type and value inputs
        super.afterAddSet(set, repeateds);

        let thisRef = this;
        for (let curRep of repeateds) {
            // Add a remove button once per filter
            if (curRep.querySelector('.swac_datafilterstored_remove'))
                continue;
            let removeBtn = curRep.querySelector('.swac_datafilterstored_remove_tpl');
            if (removeBtn) {
                removeBtn.classList.remove('swac_datafilterstored_remove_tpl');
                removeBtn.classList.add('swac_datafilterstored_remove');
                removeBtn.addEventListener('click', function (evt) {
                    evt.preventDefault();
                    thisRef.removeFilter(set);
                });
            }
        }

        // Store the filters after a filter was added
        this.saveFilters();
    }

    /**
     * Overrides onChangeFilter so the filters are stored after every change.
     *
     * @param {Event} evt Change event from an input element
     * @returns {undefined}
     */
    onChangeFilter(evt) {
        super.onChangeFilter(evt);
        this.saveFilters();
    }

    /**
     * Removes a single filter, updates the display and stores the new state.
     * When the last filter is removed all data is shown again, because the base
     * class refilterSets adds every set back that passes the (now empty) filter.
     *
     * @param {WatchableSet} set The filter set to remove
     * @returns {undefined}
     */
    removeFilter(set) {
        let sourcename = set.swac_fromName;
        // Remove the filter set, this also removes its dom representation
        this.removeSet(sourcename, set.id);
        // Reapply the remaining filters
        this.refilterSets();
        // Persist the new state
        this.saveFilters();
    }
}