var Enum = require("montage/core/enum").Enum;

exports.VmConfigBootloader = new Enum().initWithMembersAndValues(["BHYVELOAD","GRUB","UEFI","UEFI_CSM"], ["BHYVELOAD","GRUB","UEFI","UEFI_CSM"]);
