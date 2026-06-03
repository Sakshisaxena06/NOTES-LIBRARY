"""
Register all route Blueprints with the Flask app.
"""

from .auth_routes import auth_bp
from .pdf_routes import pdf_bp
from .subject_routes import subject_bp
from .student_routes import student_bp
from .feedback_routes import feedback_bp


def register_routes(app):
    """Attach every Blueprint to the given Flask app."""
    app.register_blueprint(auth_bp)
    app.register_blueprint(pdf_bp)
    app.register_blueprint(subject_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(feedback_bp)
