from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class Usuario(db.Model,UserMixin):
    __tablename__ = 'usuario'
    id = db.Column(db.Integer, primary_key = True)
    nome = db.Column(db.String(100), nullable = False)
    email = db.Column(db.String(120),unique = True, nullable = False)
    senha = db.Column(db.Text(),nullable = False)

    produtos = db.relationship('Produto', backref = 'usuario', lazy = True)

class Produto(db.Model):
    __tablename__ = 'produtos'
    id = db.Column(db.Integer, primary_key = True)
    cod = db.Column(db.Integer, nullable = False)
    sku = db.Column(db.String(50))
    nome = db.Column(db.String(100),nullable = False)
    variacao = db.Column(db.String(50),nullable = False)
    chave = db.Column(db.String(50))
    valor = db.Column(db.Float,nullable = False)
    qtd = db.Column(db.Integer, nullable = False)
    categoria = db.Column(db.String(50))

    id_user = db.Column(db.Integer, db.ForeignKey('usuario.id'),nullable=False)