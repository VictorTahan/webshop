from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, make_response, session
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, Usuario, Produto
from config import Config
from dotenv import load_dotenv
import datetime
import jwt
import os
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

load_dotenv()
JWT_TOKEN_KEY = os.getenv("JWS_TOKEN_KEY")

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'index'


@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))


@app.before_request
def verificar_token():
    if current_user.is_authenticated:
        return
    token = request.cookies.get("token")
    if not token:
        return
    try:
        dados = jwt.decode(token, JWT_TOKEN_KEY, algorithms=["HS256"])
        usuario = Usuario.query.get(dados["user_id"])
        if usuario:
            login_user(usuario)
    except ExpiredSignatureError:
        pass
    except InvalidTokenError:
        pass

@app.route('/')
def index():
    return render_template('main.html')


@app.route('/login', methods=['GET', 'POST'])
def tela_login():
    if request.method == 'POST':
        email = request.form['email']
        senha = request.form['senha']
        usuario = Usuario.query.filter_by(email=email).first()
        if usuario and bcrypt.check_password_hash(usuario.senha, senha):
            payload = {
                "user_id": usuario.id,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
            }
            token = jwt.encode(payload, JWT_TOKEN_KEY, algorithm="HS256")

            login_user(usuario)
            resp = make_response(redirect(url_for('tela_dashboard')))
            resp.set_cookie(
                "token",
                token,
                httponly=True,
                samesite='Strict',
                max_age=7 * 24 * 60 * 60
            )
            return resp
        flash('Credenciais inválidas!')
    return render_template('login.html')


@app.route('/registrar', methods=['GET', 'POST'])
def tela_registro():
    if request.method == 'POST':
        nome = request.form['username']
        email = request.form['email']
        senha = bcrypt.generate_password_hash(
            (request.form['senha'])).decode('utf-8')
        new_user = Usuario(nome=nome, email=email, senha=senha)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('tela_login'))
    return render_template('registro.html')


@app.route('/dashboard')
@login_required
def tela_dashboard():
    return render_template('dashboard.html')


@app.route("/api/produtos", methods=['POST'])
@login_required
def add_produto():
    data = request.get_json()
    novo_produto = Produto(
        cod=int(data['cod']),
        sku=data['sku'],
        nome=data['prodName'],
        variacao=data['variacao'],
        chave=data['chave'],
        valor=float(data['valor']),
        qtd=int(data['qtd']),
        categoria=data['categoria'],
        id_user=current_user.id
    )
    db.session.add(novo_produto)
    db.session.commit()

    return jsonify({"mensagem": "Produto cadastrado com sucesso!"})


@app.route("/api/produtos/<int:produto_id>", methods=['DELETE'])
@login_required
def deletar_produto(produto_id):
    produto = Produto.query.filter_by(
        id=produto_id, id_user=current_user.id).first()
    if not produto:
        return jsonify({'erro': 'Produto não encontrado'}), 404
    db.session.delete(produto)
    db.session.commit()
    return jsonify({"mensagem": "Produto removido com sucesso!"})


@app.route('/api/produtos', methods=['GET'])
@login_required
def listar_produtos():
    produtos = Produto.query.filter_by(id_user=current_user.id).all()
    produtos_json = []
    for p in produtos:
        produtos_json.append({
            "id": p.id,
            "cod": p.cod,
            "sku": p.sku,
            "nome": p.nome,
            "variacao": p.variacao,
            "chave": p.chave,
            "valor": round(p.valor, 2),
            "qtd": p.qtd,
            "categoria": p.categoria
        })
    return jsonify(produtos_json)


@app.route('/api/produtos/filtro')
def filtrar():
    cod = request.args.get('cod', '').strip()
    nome = request.args.get('nome', '').strip()

    query = Produto.query

    if cod:
        query = query.filter(Produto.cod == cod)

    if nome:
        termo_like = f"%{nome}%"
        query = query.filter(Produto.nome.ilike(termo_like))

    produtos = query.all()
    return jsonify([
        {
            "id": p.id,
            "cod": p.cod,
            "sku": p.sku,
            "nome": p.nome,
            "variacao": p.variacao,
            "chave": p.chave,
            "valor": p.valor,
            "qtd": p.qtd,
            "categoria": p.categoria
        }
        for p in produtos
    ])


@app.route('/api/produtos/<int:produto_id>', methods=['PUT'])
@login_required
def editar_produto(produto_id):
    produto = Produto.query.filter_by(
        id=produto_id, id_user=current_user.id).first()
    if not produto:
        return jsonify({'erro': 'Produto não encontrado'}), 404
    data = request.get_json()
    produto.cod = int(data.get('cod', produto.cod))
    produto.sku = data.get('sku', produto.sku)
    produto.nome = data.get('prodName', produto.nome)
    produto.variacao = data.get('variacao', produto.variacao)
    produto.chave = data.get('chave', produto.chave)
    produto.valor = float(data.get('valor', produto.valor))
    produto.qtd = int(data.get('qtd', produto.qtd))
    produto.categoria = data.get('categoria', produto.categoria)

    db.session.commit()

    return jsonify({'mensagem': 'Produto atualizado com sucesso!'})

@app.route('/logout')
def logout():
    logout_user()
    resp = make_response(redirect(url_for("tela_login")))
    resp.set_cookie("token","",expires=0)

    return resp


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
