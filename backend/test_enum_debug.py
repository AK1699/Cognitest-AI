
import enum

class DeviceType(str, enum.Enum):
    MOBILE = "mobile"
    DESKTOP = "desktop"

def test_compare():
    # Simulate DB value which might be a string
    val_from_db = "desktop"
    
    # Simulate comparison in service
    strategy = "mobile" if val_from_db == DeviceType.MOBILE else "desktop"
    print(f"Comparison 1 (db='desktop' == MOBILE): {val_from_db == DeviceType.MOBILE}")
    print(f"Strategy 1: {strategy}")
    
    val_from_db_2 = "mobile"
    strategy_2 = "mobile" if val_from_db_2 == DeviceType.MOBILE else "desktop"
    print(f"Comparison 2 (db='mobile' == MOBILE): {val_from_db_2 == DeviceType.MOBILE}")
    print(f"Strategy 2: {strategy_2}")

    # What if it's the enum member itself?
    val_enum = DeviceType.DESKTOP
    strategy_3 = "mobile" if val_enum == DeviceType.MOBILE else "desktop"
    print(f"Comparison 3 (enum=DESKTOP == MOBILE): {val_enum == DeviceType.MOBILE}")
    print(f"Strategy 3: {strategy_3}")

if __name__ == "__main__":
    test_compare()
