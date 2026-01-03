from cognitest_common import create_celery_app
from .config import settings

celery_app = create_celery_app(
    service_name="task_management",
    broker_url=settings.CELERY_BROKER_URL,
    result_backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.security_tasks",
        "app.tasks.ai_learning_tasks",
        "app.tasks.workflow_tasks",
    ]
)

# Optional: Add service-specific task routes/queues here
celery_app.conf.task_queues = {
    "security": {"exchange": "security", "routing_key": "security.#"},
    "ai": {"exchange": "ai", "routing_key": "ai.#"},
    "workflow": {"exchange": "workflow", "routing_key": "workflow.#"},
    "default": {"exchange": "default", "routing_key": "default"},
}

celery_app.conf.task_routes = {
    "app.tasks.security_tasks.*": {"queue": "security"},
    "app.tasks.ai_learning_tasks.*": {"queue": "ai"},
    "app.tasks.workflow_tasks.*": {"queue": "workflow"},
}
