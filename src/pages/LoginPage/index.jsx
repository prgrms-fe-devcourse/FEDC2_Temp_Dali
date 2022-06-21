import { useNavigate } from 'react-router-dom';
import * as S from './style';
import LoginForm from '../../feature/auth/LoginForm';
import { loginUser } from '../../apis/auth';
import { setCookie } from '../../utils/cookies';
import { useAuthContext } from '../../contexts/UserProvider';
import { LOGIN_ERROR } from '../../commons/constants/error';

const LoginPage = () => {
  const { dispatch } = useAuthContext();
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    const { user, token } = await loginUser(email, password);
    if (!user) {
      alert(LOGIN_ERROR);
      return;
    }

    await dispatch({
      type: 'LOGIN_USER',
      userName: user.fullName,
      userId: user._id,
      token,
    });

    setCookie(
      'user',
      { userName: user.fullName, userId: user._id, token },
      {
        path: '/',
        maxAge: 60 * 60 * 9, // 9시간
      },
    );

    if (token) {
      navigate(-1, { replace: true }); // registerPage에서 오면 ..?
    }
  };

  return (
    <S.LoginPageWrapper>
      <S.PlacedLogo type="skyblue" />
      <LoginForm onSubmit={handleLogin} />
    </S.LoginPageWrapper>
  );
};

export default LoginPage;
