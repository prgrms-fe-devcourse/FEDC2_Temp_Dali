import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postComments } from '../../apis/comments';
import { deleteLike, postLike } from '../../apis/like';
import { postNotifications } from '../../apis/notifications';
import { getSpecificPost } from '../../apis/posts';
import { getSpecificUser } from '../../apis/users';
import DummyData from '../../assets/data/dummyData';
import { useAuthContext } from '../../contexts/UserProvider';
import CardDetail from '../../feature/cards/CardDetail';
import PageTemplate from '../../feature/pageTemplate/PageTemplate';

const getLiked = (likes, userId) => {
  return likes.filter((like) => like.user === userId);
};

const likeToggle = (likes, userId) => {
  return !!getLiked(likes, userId).length;
};

const CardDetailPage = () => {
  const navigator = useNavigate();
  const { authUser } = useAuthContext();
  const { id } = useParams();
  const commentInput = useRef('');
  const inputRef = useRef(null);
  const [isLoading, setLoading] = useState(true);
  const [receivedUser, setReceivedUser] = useState({});
  const [props, setProps] = useState({});
  useEffect(() => {
    const getPosts = async () => {
      setLoading(true);
      const post = await getSpecificPost(id);
      const { author, title, likes, comments, _id } =
        post || DummyData.Posts[0];
      const { type, receiver, content, labels } = JSON.parse(title);
      const labelArr = Object.values(labels).filter(
        (label) => label.length > 0,
      );
      const isLike = likeToggle(likes, authUser.userId); // 접속한 유저의 id 값 넣기
      setProps({
        author,
        title,
        likes,
        comments,
        _id,
        type,
        receiver,
        content,
        labels: labelArr,
        isLike,
      });
      setLoading(false);
    };
    getPosts();
  }, [authUser]);

  const onClickLike = async () => {
    // 먼저 접속한 유저의 jwt 토큰을 가져오고 없으면 로그인 페이지로 이동
    if (!authUser.isAuth) {
      alert('로그인이 필요합니다');
      navigator('/login');
    } else if (props.isLike) {
      const targetLikeId = getLiked(props.likes, authUser.userId)[0]._id;
      const deletedLike = await deleteLike(authUser.token, targetLikeId);
      props.likes = props.likes.filter((like) => like._id !== deletedLike._id);
      setProps({ ...props, isLike: false, likes: props.likes });
    } else {
      const like = await postLike(authUser.token, props._id);
      props.likes.push(like);
      postNotifications(
        authUser.token,
        'LIKE',
        props.author._id,
        like._id,
        props._id,
      );
      setProps({ ...props, likes: props.likes, isLike: true });
    }
  };

  const onChangeInput = useCallback((e) => {
    if (e.target.value.length <= 1) inputRef.current = e.target;
    commentInput.current = e.target.value;
  });

  const onSubmitInput = async (e) => {
    e.preventDefault();
    if (!authUser.isAuth) {
      alert('로그인이 필요합니다');
      navigator('/login');
    } else {
      const comment = await postComments(
        authUser.token,
        props._id,
        commentInput.current,
      );
      if (comment) props.comments.push(comment);
      inputRef.current.value = '';
      setProps({ ...props, comments: props.comments });
      postNotifications(
        authUser.token,
        'COMMENT',
        props.author._id,
        comment._id,
        props._id,
      ); // 로그인한 user Id 필요
    }
  };

  return (
    <PageTemplate>
      {!isLoading && (
        <CardDetail
          authorName={props.author.fullName}
          authorId={props.author._id}
          receiverName={props.receiver.fullName}
          receiverId={props.receiver._id}
          comments={props.comments}
          likeCount={props.likes.length}
          labelItems={props.labels}
          PraiseReason={props.content}
          onChangeInput={onChangeInput}
          onSubmitInput={onSubmitInput}
          onClickLike={onClickLike}
          isLike={props.isLike}
        />
      )}
    </PageTemplate>
  );
};

export default CardDetailPage;
