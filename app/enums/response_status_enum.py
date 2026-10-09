from enum import Enum

class ResponseStatus(str, Enum):
    """
    Standard Response Status Enum for Dan AI Engine Microservice.
    """
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
