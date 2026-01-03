from .core.celery_app import celery_app
import app.tasks.security_tasks
import app.tasks.ai_learning_tasks
import app.tasks.workflow_tasks

if __name__ == "__main__":
    celery_app.start()
