// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ColdChain {

    // =========================================================
    // 1. USER ROLES
    // =========================================================

    enum Role {
        NONE,
        ADMIN,
        MANUFACTURER,
        TRANSPORTER,
        WAREHOUSE,
        DISTRIBUTOR,
        HOSPITAL
    }

    // =========================================================
    // 2. SHIPMENT STATUS (State Machine)
    // =========================================================

    enum Status {
        CREATED,
        ASSIGNED,
        IN_TRANSIT,
        AT_WAREHOUSE,
        AT_DISTRIBUTOR,
        AT_HOSPITAL,
        COMPLETED,
        CANCELLED,
        RESHIPMENT_REQUESTED
    }

    // =========================================================
    // 3. SHIPMENT
    // =========================================================

    struct Shipment {

        string shipmentId;

        address manufacturer;

        address currentCustodian;

        address assignedCustodian;

        int256 minTemperature;

        int256 maxTemperature;

        uint256 createdAt;

        Status status;
    }

    // =========================================================
    // 4. TEMPERATURE READING
    // =========================================================

    struct TemperatureReading {

        string shipmentId;

        int256 temperature;

        int256 humidity;

        uint256 timestamp;

        bool violation;

        bytes32 dataHash;
    }

    // =========================================================
    // 5. TEMPERATURE VIOLATION
    // =========================================================

    struct Violation {

        string shipmentId;

        int256 temperature;

        uint256 timestamp;

        string reason;

        bytes32 dataHash;
    }

    // =========================================================
    // 6. CUSTODY EVENT
    // =========================================================

    struct CustodyEvent {

        string shipmentId;

        address from;

        address to;

        uint256 timestamp;

        uint256 blockNumber;
    }

    // =========================================================
    // 7. ADMIN
    // =========================================================

    address public admin;

    // =========================================================
    // 8. ROLE MAPPING + USER INDEX
    // =========================================================

    mapping(address => Role) public roles;

    address[] public userAddresses;

    mapping(address => bool) private userIndexed;

    // =========================================================
    // 8a. PARTICIPANT NAMES
    // =========================================================

    mapping(address => string) public participantNames;

    // =========================================================
    // 8b. CANCELLATION REASONS
    // =========================================================

    mapping(string => string) public cancellationReasons;

    // =========================================================
    // 9. SHIPMENT MAPPING + INDEX
    // =========================================================

    mapping(string => Shipment) public shipments;

    string[] public shipmentIds;

    mapping(string => bool) private shipmentIndexed;

    // =========================================================
    // 10. IMMUTABLE HISTORIES
    // =========================================================

    Violation[] public violations;

    TemperatureReading[] public temperatureReadings;

    CustodyEvent[] public custodyEvents;

    // =========================================================
    // 11. EVENTS
    // =========================================================

    event UserRegistered(
        address indexed user,
        Role role
    );

    event ShipmentCreated(
        string indexed shipmentId,
        address indexed manufacturer
    );

    event CustodyAssigned(
        string indexed shipmentId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event CustodyAccepted(
        string indexed shipmentId,
        address indexed custodian,
        uint256 timestamp
    );

    event CustodyTransferred(
        string indexed shipmentId,
        address indexed from,
        address indexed to,
        uint256 timestamp,
        uint256 blockNumber
    );

    event TemperatureRecorded(
        string indexed shipmentId,
        int256 temperature,
        int256 humidity,
        uint256 timestamp,
        bool violation,
        bytes32 dataHash
    );

    event TemperatureViolation(
        string indexed shipmentId,
        int256 temperature,
        uint256 timestamp,
        bytes32 dataHash
    );

    event ShipmentCancelled(
        string indexed shipmentId,
        address indexed cancelledBy,
        uint256 timestamp
    );

    event ReshipmentRequested(
        string indexed shipmentId,
        address indexed requestedBy,
        uint256 timestamp
    );

    event ShipmentCompleted(
        string indexed shipmentId,
        address indexed completedBy,
        uint256 timestamp
    );

    event UserRemoved(
        address indexed user,
        uint256 timestamp
    );

    event ParticipantNameSet(
        address indexed user,
        string name
    );

    event ShipmentCancelledWithReason(
        string indexed shipmentId,
        address indexed cancelledBy,
        string reason,
        uint256 timestamp
    );

    // =========================================================
    // 12. CONSTRUCTOR
    // =========================================================

    constructor() {

        admin = msg.sender;

        roles[msg.sender] = Role.ADMIN;

        userAddresses.push(msg.sender);

        userIndexed[msg.sender] = true;
    }

    // =========================================================
    // 13. MODIFIERS
    // =========================================================

    modifier onlyAdmin() {

        require(
            msg.sender == admin,
            "Only admin can perform this action"
        );

        _;
    }

    modifier authorizedRecorder() {

        require(
            roles[msg.sender] != Role.NONE,
            "Not authorized to record temperature"
        );

        _;
    }

    // =========================================================
    // 14. REGISTER USER
    // =========================================================

    function registerUser(
        address user,
        Role role
    )
        external
        onlyAdmin
    {

        require(
            user != address(0),
            "Invalid address"
        );

        require(
            role != Role.NONE,
            "Invalid role"
        );

        require(
            role != Role.ADMIN,
            "Cannot assign admin role"
        );

        roles[user] = role;

        if (!userIndexed[user]) {

            userAddresses.push(user);

            userIndexed[user] = true;
        }

        emit UserRegistered(
            user,
            role
        );
    }

    function getUserCount()
        external
        view
        returns (uint256)
    {
        return userAddresses.length;
    }

    function getUserAt(
        uint256 index
    )
        external
        view
        returns (address, Role)
    {
        require(
            index < userAddresses.length,
            "Invalid user index"
        );

        return (
            userAddresses[index],
            roles[userAddresses[index]]
        );
    }

    function getUserRole(
        address user
    )
        external
        view
        returns (Role)
    {
        return roles[user];
    }

    // =========================================================
    // 14a. REMOVE USER
    // =========================================================

    function removeUser(
        address user
    )
        external
        onlyAdmin
    {
        require(
            user != address(0),
            "Invalid address"
        );

        require(
            roles[user] != Role.NONE,
            "User not registered"
        );

        require(
            user != admin,
            "Cannot remove admin"
        );

        roles[user] = Role.NONE;

        emit UserRemoved(
            user,
            block.timestamp
        );
    }

    // =========================================================
    // 14b. SET PARTICIPANT NAME
    // =========================================================

    function setParticipantName(
        address user,
        string calldata name
    )
        external
        onlyAdmin
    {
        require(
            roles[user] != Role.NONE,
            "User not registered"
        );

        participantNames[user] = name;

        emit ParticipantNameSet(
            user,
            name
        );
    }

    // =========================================================
    // 14c. GET ROLE COUNT BY ROLE
    // =========================================================

    function getRoleCount(
        Role targetRole
    )
        external
        view
        returns (uint256)
    {
        uint256 count = 0;

        for (
            uint256 i = 0;
            i < userAddresses.length;
            i++
        ) {
            if (
                roles[userAddresses[i]] == targetRole
            ) {
                count++;
            }
        }

        return count;
    }

    // =========================================================
    // 15. CREATE SHIPMENT
    // =========================================================

    function createShipment(
        string memory shipmentId,
        int256 minTemperature,
        int256 maxTemperature
    )
        external
    {

        require(
            roles[msg.sender] == Role.MANUFACTURER,
            "Only manufacturer can create shipment"
        );

        require(
            bytes(shipmentId).length > 0,
            "Invalid shipment ID"
        );

        require(
            minTemperature < maxTemperature,
            "Invalid temperature range"
        );

        require(
            !shipmentIndexed[shipmentId],
            "Shipment ID already exists"
        );

        shipments[shipmentId] = Shipment({

            shipmentId: shipmentId,

            manufacturer: msg.sender,

            currentCustodian: msg.sender,

            assignedCustodian: address(0),

            minTemperature: minTemperature,

            maxTemperature: maxTemperature,

            createdAt: block.timestamp,

            status: Status.CREATED
        });

        shipmentIds.push(shipmentId);

        shipmentIndexed[shipmentId] = true;

        emit ShipmentCreated(
            shipmentId,
            msg.sender
        );
    }

    function getShipment(
        string memory shipmentId
    )
        external
        view
        returns (
            string memory,
            address,
            address,
            address,
            int256,
            int256,
            uint256,
            uint8
        )
    {
        Shipment memory shipment = shipments[shipmentId];

        return (

            shipment.shipmentId,

            shipment.manufacturer,

            shipment.currentCustodian,

            shipment.assignedCustodian,

            shipment.minTemperature,

            shipment.maxTemperature,

            shipment.createdAt,

            uint8(shipment.status)
        );
    }

    function getShipmentCount()
        external
        view
        returns (uint256)
    {
        return shipmentIds.length;
    }

    function getShipmentByIndex(
        uint256 index
    )
        external
        view
        returns (string memory)
    {
        require(
            index < shipmentIds.length,
            "Invalid shipment index"
        );

        return shipmentIds[index];
    }

    function getAllShipments()
        external
        view
        returns (Shipment[] memory)
    {
        Shipment[] memory result =
            new Shipment[](shipmentIds.length);

        for (
            uint256 i = 0;
            i < shipmentIds.length;
            i++
        ) {
            result[i] =
                shipments[shipmentIds[i]];
        }

        return result;
    }

    function getShipmentsByCustodian(
        address custodian
    )
        external
        view
        returns (string[] memory)
    {
        uint256 count = 0;

        for (
            uint256 i = 0;
            i < shipmentIds.length;
            i++
        ) {
            if (
                shipments[shipmentIds[i]]
                    .currentCustodian == custodian
            ) {
                count++;
            }
        }

        string[] memory result =
            new string[](count);

        uint256 index = 0;

        for (
            uint256 i = 0;
            i < shipmentIds.length;
            i++
        ) {
            if (
                shipments[shipmentIds[i]]
                    .currentCustodian == custodian
            ) {
                result[index] =
                    shipmentIds[i];
                index++;
            }
        }

        return result;
    }

    function getShipmentsByManufacturer(
        address manufacturer
    )
        external
        view
        returns (string[] memory)
    {
        uint256 count = 0;

        for (
            uint256 i = 0;
            i < shipmentIds.length;
            i++
        ) {
            if (
                shipments[shipmentIds[i]]
                    .manufacturer == manufacturer
            ) {
                count++;
            }
        }

        string[] memory result =
            new string[](count);

        uint256 index = 0;

        for (
            uint256 i = 0;
            i < shipmentIds.length;
            i++
        ) {
            if (
                shipments[shipmentIds[i]]
                    .manufacturer == manufacturer
            ) {
                result[index] =
                    shipmentIds[i];
                index++;
            }
        }

        return result;
    }

    function getShipmentsByAssigned(
        address custodian
    )
        external
        view
        returns (string[] memory)
    {
        uint256 count = 0;

        for (
            uint256 i = 0;
            i < shipmentIds.length;
            i++
        ) {
            if (
                shipments[shipmentIds[i]]
                    .assignedCustodian == custodian
            ) {
                count++;
            }
        }

        string[] memory result =
            new string[](count);

        uint256 index = 0;

        for (
            uint256 i = 0;
            i < shipmentIds.length;
            i++
        ) {
            if (
                shipments[shipmentIds[i]]
                    .assignedCustodian == custodian
            ) {
                result[index] =
                    shipmentIds[i];
                index++;
            }
        }

        return result;
    }

    // =========================================================
    // 16. CUSTODY SEQUENCE RULE
    // =========================================================

    function nextRole(
        Role role
    )
        private
        pure
        returns (Role)
    {
        if (role == Role.MANUFACTURER) {
            return Role.TRANSPORTER;
        }

        if (role == Role.TRANSPORTER) {
            return Role.WAREHOUSE;
        }

        if (role == Role.WAREHOUSE) {
            return Role.DISTRIBUTOR;
        }

        if (role == Role.DISTRIBUTOR) {
            return Role.HOSPITAL;
        }

        return Role.NONE;
    }

    function statusForRole(
        Role role
    )
        private
        pure
        returns (Status)
    {
        if (role == Role.TRANSPORTER) {
            return Status.IN_TRANSIT;
        }

        if (role == Role.WAREHOUSE) {
            return Status.AT_WAREHOUSE;
        }

        if (role == Role.DISTRIBUTOR) {
            return Status.AT_DISTRIBUTOR;
        }

        if (role == Role.HOSPITAL) {
            return Status.AT_HOSPITAL;
        }

        return Status.CREATED;
    }

    // =========================================================
    // 17. TRANSFER CUSTODY (Assigns next custodian)
    // =========================================================

    function transferCustody(
        string memory shipmentId,
        address newCustodian
    )
        external
    {

        Shipment storage shipment =
            shipments[shipmentId];

        require(
            shipment.status != Status.COMPLETED,
            "Shipment is already completed"
        );

        require(
            shipment.status != Status.CANCELLED,
            "Shipment is cancelled"
        );

        require(
            shipment.status != Status.RESHIPMENT_REQUESTED,
            "Shipment has a pending reshipment request"
        );

        require(
            shipment.status != Status.ASSIGNED,
            "Shipment is already assigned, await acceptance"
        );

        require(
            shipment.currentCustodian == msg.sender,
            "Only current custodian can transfer shipment"
        );

        require(
            newCustodian != address(0),
            "Invalid destination address"
        );

        Role senderRole =
            roles[msg.sender];

        require(
            senderRole != Role.NONE,
            "Sender is not registered"
        );

        require(
            roles[newCustodian] != Role.NONE,
            "Destination user is not registered"
        );

        require(
            nextRole(senderRole) == roles[newCustodian],
            "Invalid custody sequence"
        );

        shipment.assignedCustodian = newCustodian;

        shipment.status = Status.ASSIGNED;

        emit CustodyAssigned(
            shipmentId,
            msg.sender,
            newCustodian,
            block.timestamp
        );
    }

    // =========================================================
    // 18. ACCEPT CUSTODY
    // =========================================================

    function acceptCustody(
        string memory shipmentId
    )
        external
    {

        Shipment storage shipment =
            shipments[shipmentId];

        require(
            shipment.status == Status.ASSIGNED,
            "Shipment is not in ASSIGNED state"
        );

        require(
            shipment.assignedCustodian == msg.sender,
            "You are not the assigned custodian"
        );

        address previousCustodian =
            shipment.currentCustodian;

        shipment.currentCustodian = msg.sender;

        shipment.assignedCustodian = address(0);

        Role acceptorRole = roles[msg.sender];

        shipment.status = statusForRole(acceptorRole);

        custodyEvents.push(

            CustodyEvent({

                shipmentId: shipmentId,

                from: previousCustodian,

                to: msg.sender,

                timestamp: block.timestamp,

                blockNumber: block.number
            })

        );

        emit CustodyAccepted(
            shipmentId,
            msg.sender,
            block.timestamp
        );

        emit CustodyTransferred(
            shipmentId,
            previousCustodian,
            msg.sender,
            block.timestamp,
            block.number
        );
    }

    // =========================================================
    // 19. CANCEL SHIPMENT
    // =========================================================

    function cancelShipment(
        string memory shipmentId
    )
        external
    {

        Shipment storage shipment =
            shipments[shipmentId];

        require(
            shipment.status != Status.COMPLETED,
            "Cannot cancel completed shipment"
        );

        require(
            shipment.status != Status.CANCELLED,
            "Shipment is already cancelled"
        );

        require(
            shipment.currentCustodian == msg.sender ||
            msg.sender == admin,
            "Only current custodian or admin can cancel"
        );

        shipment.status = Status.CANCELLED;

        emit ShipmentCancelled(
            shipmentId,
            msg.sender,
            block.timestamp
        );
    }

    // =========================================================
    // 19a. CANCEL SHIPMENT WITH REASON
    // =========================================================

    function cancelShipmentWithReason(
        string memory shipmentId,
        string calldata reason
    )
        external
    {

        Shipment storage shipment =
            shipments[shipmentId];

        require(
            shipment.status != Status.COMPLETED,
            "Cannot cancel completed shipment"
        );

        require(
            shipment.status != Status.CANCELLED,
            "Shipment is already cancelled"
        );

        require(
            shipment.currentCustodian == msg.sender ||
            msg.sender == admin,
            "Only current custodian or admin can cancel"
        );

        require(
            bytes(reason).length > 0,
            "Cancellation reason is required"
        );

        shipment.status = Status.CANCELLED;

        cancellationReasons[shipmentId] = reason;

        emit ShipmentCancelledWithReason(
            shipmentId,
            msg.sender,
            reason,
            block.timestamp
        );

        emit ShipmentCancelled(
            shipmentId,
            msg.sender,
            block.timestamp
        );
    }

    // =========================================================
    // 20. REQUEST RESHIPMENT
    // =========================================================

    function requestReshipment(
        string memory shipmentId
    )
        external
    {

        Shipment storage shipment =
            shipments[shipmentId];

        require(
            shipment.status != Status.COMPLETED,
            "Cannot request reshipment for completed shipment"
        );

        require(
            shipment.status != Status.CANCELLED,
            "Cannot request reshipment for cancelled shipment"
        );

        Role callerRole = roles[msg.sender];

        require(
            callerRole == Role.TRANSPORTER ||
            callerRole == Role.ADMIN,
            "Only transporter or admin can request reshipment"
        );

        require(
            shipment.currentCustodian == msg.sender ||
            msg.sender == admin,
            "Only current custodian or admin can request reshipment"
        );

        shipment.status = Status.RESHIPMENT_REQUESTED;

        emit ReshipmentRequested(
            shipmentId,
            msg.sender,
            block.timestamp
        );
    }

    // =========================================================
    // 21. RECORD TEMPERATURE
    // =========================================================

    function recordTemperature(
        string memory shipmentId,
        int256 temperature,
        int256 humidity,
        bytes32 dataHash
    )
        external
        authorizedRecorder
    {
        require(
            shipments[shipmentId].status != Status.COMPLETED &&
            shipments[shipmentId].status != Status.CANCELLED,
            "Cannot record temperature for this shipment state"
        );

        bool violation =
            temperature < shipments[shipmentId].minTemperature ||
            temperature > shipments[shipmentId].maxTemperature;

        temperatureReadings.push(

            TemperatureReading({

                shipmentId: shipmentId,

                temperature: temperature,

                humidity: humidity,

                timestamp: block.timestamp,

                violation: violation,

                dataHash: dataHash
            })

        );

        emit TemperatureRecorded(

            shipmentId,

            temperature,

            humidity,

            block.timestamp,

            violation,

            dataHash

        );

        if (violation) {

            violations.push(

                Violation({

                    shipmentId: shipmentId,

                    temperature: temperature,

                    timestamp: block.timestamp,

                    reason: "Temperature outside allowed range",

                    dataHash: dataHash
                })

            );

            emit TemperatureViolation(

                shipmentId,

                temperature,

                block.timestamp,

                dataHash
            );
        }
    }

    function getTemperatureReadingCount()
        external
        view
        returns (uint256)
    {
        return temperatureReadings.length;
    }

    function getTemperatureReading(
        uint256 index
    )
        external
        view
        returns (TemperatureReading memory)
    {
        require(
            index < temperatureReadings.length,
            "Invalid reading index"
        );

        return temperatureReadings[index];
    }

    function getTemperatureReadingsByShipment(
        string memory shipmentId
    )
        external
        view
        returns (TemperatureReading[] memory)
    {
        uint256 count = 0;

        for (
            uint256 i = 0;
            i < temperatureReadings.length;
            i++
        ) {
            if (
                keccak256(
                    bytes(temperatureReadings[i].shipmentId)
                ) ==
                keccak256(bytes(shipmentId))
            ) {
                count++;
            }
        }

        TemperatureReading[] memory result =
            new TemperatureReading[](count);

        uint256 index = 0;

        for (
            uint256 i = 0;
            i < temperatureReadings.length;
            i++
        ) {
            if (
                keccak256(
                    bytes(temperatureReadings[i].shipmentId)
                ) ==
                keccak256(bytes(shipmentId))
            ) {
                result[index] =
                    temperatureReadings[i];
                index++;
            }
        }

        return result;
    }

    function getLatestTemperature(
        string memory shipmentId
    )
        external
        view
        returns (TemperatureReading memory)
    {
        for (
            uint256 i = temperatureReadings.length;
            i > 0;
            i--
        ) {
            if (
                keccak256(
                    bytes(temperatureReadings[i - 1].shipmentId)
                ) ==
                keccak256(bytes(shipmentId))
            ) {
                return temperatureReadings[i - 1];
            }
        }

        return TemperatureReading({

            shipmentId: shipmentId,

            temperature: 0,

            humidity: 0,

            timestamp: 0,

            violation: false,

            dataHash: bytes32(0)

        });
    }

    // =========================================================
    // 22. VIOLATIONS
    // =========================================================

    function getViolationCount()
        external
        view
        returns (uint256)
    {
        return violations.length;
    }

    function getViolation(
        uint256 index
    )
        external
        view
        returns (Violation memory)
    {
        require(
            index < violations.length,
            "Invalid violation index"
        );

        return violations[index];
    }

    function getViolationsByShipment(
        string memory shipmentId
    )
        external
        view
        returns (Violation[] memory)
    {
        uint256 count = 0;

        for (
            uint256 i = 0;
            i < violations.length;
            i++
        ) {
            if (
                keccak256(
                    bytes(violations[i].shipmentId)
                ) ==
                keccak256(bytes(shipmentId))
            ) {
                count++;
            }
        }

        Violation[] memory result =
            new Violation[](count);

        uint256 index = 0;

        for (
            uint256 i = 0;
            i < violations.length;
            i++
        ) {
            if (
                keccak256(
                    bytes(violations[i].shipmentId)
                ) ==
                keccak256(bytes(shipmentId))
            ) {
                result[index] =
                    violations[i];
                index++;
            }
        }

        return result;
    }

    // =========================================================
    // 23. COMPLETE SHIPMENT
    // =========================================================

    function completeShipment(
        string memory shipmentId
    )
        external
    {
        Shipment storage shipment =
            shipments[shipmentId];

        require(
            shipment.status == Status.AT_HOSPITAL,
            "Shipment must be at hospital to complete"
        );

        require(
            roles[msg.sender] == Role.HOSPITAL,
            "Only hospital can complete shipment"
        );

        require(
            shipment.currentCustodian == msg.sender,
            "Only current custodian can complete shipment"
        );

        shipment.status = Status.COMPLETED;

        emit ShipmentCompleted(
            shipmentId,
            msg.sender,
            block.timestamp
        );
    }

    // =========================================================
    // 24. BACKWARD COMPAT (closeShipment alias)
    // =========================================================

    function closeShipment(
        string memory shipmentId
    )
        external
    {
        Shipment storage shipment =
            shipments[shipmentId];

        require(
            shipment.status != Status.COMPLETED,
            "Shipment is already completed"
        );

        require(
            shipment.status != Status.CANCELLED,
            "Shipment is cancelled"
        );

        require(
            roles[msg.sender] == Role.HOSPITAL,
            "Only hospital can close shipment"
        );

        require(
            shipment.currentCustodian == msg.sender,
            "Only current custodian can close shipment"
        );

        shipment.status = Status.COMPLETED;

        emit ShipmentCompleted(
            shipmentId,
            msg.sender,
            block.timestamp
        );
    }

}
