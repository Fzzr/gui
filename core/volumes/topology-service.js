var Montage = require("montage").Montage,
    Model = require("core/model/model").Model;

exports.TopologyService = Montage.specialize({
    _STORAGE: {
        value: "storage"
    },

    _REDUNDANCY: {
        value: "redundancy"
    },

    _SPEED: {
        value: "speed"
    },

    _dataService: {
        value: null
    },

    _vdevRecommendations: {
        value: null
    },

    constructor: {
        value: function() {
            var self = this;
            Model.populateObjectPrototypeForType(Model.ZfsVdev).then(function () {
                return Model.populateObjectPrototypeForType(Model.Volume);
            }).then(function (Volume) {
                Volume.constructor.vdevRecommendations().then(function(vdevRecommendations){
                    self._vdevRecommendations = vdevRecommendations;
                });
            });
        }
    },

    init: {
        value: function(dataService) {
            this._dataService = dataService;
            return this;
        }
    },

    _getVdevRecommendation: {
        value: function(redundancy, speed, storage) {
            var priorities = [
                    {type: this._STORAGE, tieBreaker: 2, weight: Math.round(storage * 10) / 10},
                    {type: this._REDUNDANCY, tieBreaker: 0, weight: Math.round(redundancy * 10) / 10},
                    {type: this._SPEED, tieBreaker: 1, weight: Math.round(speed * 10) / 10}
                ],
                orderedPriorities = priorities.sort(function (a, b) {
                    var delta = b.weight - a.weight;
                    if (delta == 0) {
                        delta = b.tieBreaker - a.tieBreaker;
                    }
                    return delta;
                }),
                firstPriority = orderedPriorities[0],
                secondPriority = orderedPriorities[1].weight > 0 ? orderedPriorities[1] : orderedPriorities[0];

            return this._vdevRecommendations[firstPriority.type][secondPriority.type];
        }
    },

    _getDisksGroups: {
        value: function(disks) {
            var disksGroups = [],
                groupsUniquer = {},
                i, length, disk, key;
            for (i = 0, length = disks.length; i < disks.length; i++) {
                disk = disks[i];
                key = [disk.is_ssd, disk.mediasize, disk.max_rotation].join('_');
                if (!groupsUniquer[key]) {
                    groupsUniquer[key] = [];
                    disksGroups.push(groupsUniquer[key]);
                }
                // Make non ssd weighter than ssd
                disk.isSpinning = 1/(1+disk.is_ssd);
                groupsUniquer[key].push(disk);
            }
            return disksGroups.sort(function(a, b) {
                var delta = b.length - a.length,
                    meaningfulSpecifications = ['isSpinning', 'size'],
                    diskA = a[0], diskB = b[0],
                    specification;
                while (delta == 0 && meaningfulSpecifications.length > 0 && diskA) {
                    specification = meaningfulSpecifications.shift();
                    delta = +diskB[specification] - +diskA[specification];
                }
                return delta;
            });
        }
    },

    _getDiskVdev: {
        value: function(disk) {
            var vdev = this._dataService.getDataObject(Model.ZfsVdev);
            vdev.path = disk.status.gdisk_name;
            return vdev;
        }
    },

    _buildVdevWithDisks: {
        value: function (type, disks) {
            var vdev = this._dataService.getDataObject(Model.ZfsVdev);
            vdev.type = type;
            this._addDisksToVdev(disks, vdev);
            return vdev;
        }
    },

    _addDisksToVdev: {
        value: function(disks, vdev) {
            if (!vdev.children) {
                vdev.children = [];
            }
            Array.prototype.push.apply(vdev.children, disks.map(this._getDiskVdev.bind(this)));
        }
    },

    _buildDataVdevsWithDisks: {
        value: function(type, size, dataDisks) {
            var vdevs = [],
                disks = dataDisks.slice(0, size),
                sliceStart = size;

            vdevs.push(this._buildVdevWithDisks(type, disks));
            disks = dataDisks.slice(sliceStart, sliceStart + size);
            sliceStart += size;

            while (disks.length >= size) {
                vdevs.push(this._buildVdevWithDisks(type, disks));
                disks = dataDisks.slice(sliceStart, sliceStart + size);
                sliceStart += size;
            }

            if (disks.length > 0) {
                if (vdevs.length == 1) {
                    if (disks.length <= (size / 2)) {
                        this._addDisksToVdev(disks, vdevs[0]);
                    } else {
                        vdevs = this._buildDataVdevsWithDisks(type, Math.round(dataDisks.length / 2), dataDisks);
                    }
                } else {
                    var i, length, vdev,
                        bonusDiskCountPerVdev = Math.round(disks.length / vdevs.length);
                    for (i = 0, length = vdevs.length; i < length; i++) {
                        vdev = vdevs[i];
                        this._addDisksToVdev(disks.slice(i*bonusDiskCountPerVdev, i*bonusDiskCountPerVdev + bonusDiskCountPerVdev), vdev);
                    }
                }
            }
            return vdevs;
        }
    },

    generateTopology: {
        value: function(topology, disks, redundancy, speed, storage) {
            var vdevRecommendation,
                disksGroups = this._getDisksGroups(disks),
                dataDisks = disksGroups.shift();

            if (dataDisks.length > 3) {
                vdevRecommendation = this._getVdevRecommendation(redundancy, speed, storage);
            } else if (dataDisks.length > 2) {
                vdevRecommendation = {
                    type: 'raidz1',
                    drives: 3
                };
            } else {
                vdevRecommendation = {
                    type: 'mirror',
                    drives: 2
                };
            }

            topology.data = this._buildDataVdevsWithDisks(vdevRecommendation.type, vdevRecommendation.drives, dataDisks);
        }
    }
});
