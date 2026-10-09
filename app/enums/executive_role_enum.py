from enum import Enum

class ExecutiveDepartmentRole(str, Enum):
    """
    Executive Department Roles for Dan ESR Multi-Agent System.
    """
    RND = "rnd"
    CFO = "cfo"
    OPS = "ops"
    LOGISTICS = "logistics"
    CSKH = "cskh"
    HR = "hr"
