import axios from "axios";
import { Component } from "react";
import { Button } from "react-bootstrap";
import IconMatch from "../../../images/icon-match";
import UserTypeLabel from "../../components/helpers/UserTypeLabel";
import * as helper from "../../components/helpers/utilityFunctions";
import { showAlumniWorkInfo } from "../../components/helpers/utilityFunctions";
import {
  ACTION_BOSYU_START_EDIT_BOSYU,
  ACTION_FEED_COMMENT,
  ACTION_FEED_LIKE,
  ACTION_FEED_VIEW_PROFILE,
  CATEGORY_FEED,
} from "../../constants/ga";
import GA from "../../lib/GA";
import UserMention from "../messaging/UserMention";
import EventPost from "./EventPost";
import FeedComment from "./FeedComment";
import FeedCommentExpand from "./FeedCommentExpand";
import FeedPoll from "./FeedPoll";
import {
  getCategoryText,
  uniqueCommentersShown as uniqueShown,
} from "./helpers";
import { NormalizeAlumniData2 } from "./NormalizeAlumniData";
import PostModal from "./post/PostModal";
class FeedItemPost extends Component {
  constructor(props) {
    super(props);
    const {
      bookmark: bm,
      interested: intrst,
      like_count: likeCount,
      liked,
      post_type: postType,
    } = props;

    this.state = {
      mentionsLoaded: false,
      showUserMention: false,
      toSearchMention: "",
      showCommentForm: false,
      comment: "",
      expandCommentSection: false,
      sendingComment: false,
      sendingLike: false,
      loadingBookmark: false,
      bookmarked:
        (typeof bm == "boolean" && bm) || [0, 1].includes(bm) ? !!bm : false,
      interestedLoading: false,
      interested:
        (typeof intrst == "boolean" && intrst) || [0, 1].includes(intrst)
          ? !!intrst
          : false,
      likes: props.likes || [],
      comments: props.comments || [],
      canSendComment: false,
      loading: false,
      hide: false,
      isOnScreen: false,
      showPostModal: null,
      isRead: props.isRead || false,
      isMobile: window.innerWidth < 768,
      messageUrl: "",
      liked,
      like_count: likeCount,
      imgWidth: 0,
    };
  }

  componentDidMount() {
    const { feed_type } = this.props;
    window.addEventListener("resize", () => {
      this.setState({
        isMobile: window.innerWidth < 768,
      });
    });

    this.isScrolledIntoView();
    this.addScrollListening();
    this.iniEditableDiv();
  }

  componentDidUpdate(prevProps, prevState) {
    const { showUserMention, mentionsLoaded, isOnScreen, isMobile } =
      this.state;

    if (isMobile !== prevState.isMobile) {
      this.addScrollListening();
    }

    if (isOnScreen !== prevState.isOnScreen && isOnScreen) {
      this.markAsRead();
    }

    if (showUserMention !== prevState.showUserMention) {
      if (showUserMention && !mentionsLoaded) {
        // only ini once
        this.iniEditableDiv();
      }

      if (showUserMention) {
        this.iniClickEventListener();
      }
    }

    if (isMobile && prevState.comment !== this.state.comment) {
      // the contenteditable is messing with the focus on the keyboard
      // when in mobile, hence this special lines of code

      // if (lengthState < lengthPrev) {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (range) {
          const { startContainer } = range;
          const { parentNode } = startContainer;
          if (parentNode.tagName === "SPAN") {
            parentNode.parentNode.removeChild(parentNode);
          }
        }
      }
      // }
    }
  }

  componentWillUnmount() {
    const { isMobile } = this.state;
    const feedContainer = !isMobile
      ? document.querySelector(".layout-user .componentPane > div")
      : window;

    feedContainer.removeEventListener("scroll", this.isScrolledIntoView);
  }

  handleImageEnlarge() {
    const { showImageModal } = this.state;
    this.setState({
      showImageModal: !showImageModal,
    });
  }

  addScrollListening = () => {
    const { feed_type } = this.props;
    const { isMobile } = this.state;

    const feedContainer = !isMobile
      ? document.querySelector(".layout-user .componentPane > div")
      : window;

    if (feedContainer) {
      feedContainer.removeEventListener("scroll", this.isScrolledIntoView);
      feedContainer.addEventListener("scroll", this.isScrolledIntoView);
    }
  };

  markAsRead = () => {
    const { isRead } = this.state;
    const { user, activeCompany, id: feedId, fromPostList } = this.props;
    if (!isRead && !fromPostList) {
      axios
        .post(`/api/alumni/${activeCompany.slug}/post/mark-as-read`, {
          feedId,
        })
        .then(() => {
          this.setState({
            isRead: true,
          });
        });
    }
  };

  toggleCommentForm = () => {
    this.setState({ showCommentForm: !this.state.showCommentForm });
  };

  toggleCommentSection = () => {
    this.setState({ expandCommentSection: !this.state.expandCommentSection });
  };

  onInputComment = (event) => {
    this.mentionListener();
    // event.preventDefault();
    const { target } = event;
    const { innerHTML: value, innerText } = target || event;
    const emojiDetect = helper.detectEmojis(innerText);
    this.setState({
      comment: value,
      canSendComment:
        innerText.length > 0 && innerText.length < 256 && !emojiDetect,
    });
  };

  sendComment = (event) => {
    const { comment: message } = this.state;
    let mentions = [];
    const doc = new DOMParser().parseFromString(message, "text/html");
    const spans = doc.querySelectorAll("span");
    for (let i = 0; i < spans.length; i++) {
      mentions.push({
        slug: spans[i].getAttribute("name"),
        fullName: spans[i].innerHTML,
      });
    }

    if (mentions && mentions.length > 0) {
      mentions = mentions.filter((mention, index) => {
        const nextIndex = index + 1;
        const indexOf = mentions
          .map((mentionMap) => {
            return mentionMap.slug;
          })
          .indexOf(mention.slug, nextIndex);

        if (indexOf < 0 && indexOf !== index) {
          return mention;
        }
      });
    }

    const { activeCompany, feedIndex } = this.props;
    GA.event(CATEGORY_FEED, ACTION_FEED_COMMENT);
    event.preventDefault();

    if (!this.state.canSendComment) {
      return;
    }

    if (this.state.sendingComment) {
      return;
    }

    this.setState({ sendingComment: true });

    axios
      .post(
        `/api/alumni/${activeCompany.slug}/feed/comment`,
        {
          mentions: mentions,
          feed_id: this.props.id,
          comment: this.state.comment,
        },
        {
          headers: {
            Authorization: "Bearer " + this.props.user.api_token,
          },
        }
      )
      .then((res) => {
        this.setState({ canSendComment: false, comment: "" });
        document.getElementById(`text-area-editable-${feedIndex}`).innerHTML =
          "";
        if (res.data) {
          this.setState({ comments: res.data });
        }
      })
      .catch((error) => {
        // console.error('post feed like error', error);
        this.setState({ sendingComment: false, comment: "" });
      })
      .then(() => {
        this.setState({ sendingComment: false });
      });
  };

  toggleLike = (event) => {
    const { feed_type } = this.props;

    GA.event(CATEGORY_FEED, ACTION_FEED_LIKE);
    event.preventDefault();

    const { sendingLike } = this.state;
    const { activeCompany, id, user } = this.props;

    if (sendingLike) {
      return;
    }

    const url = `/api/alumni/${activeCompany.slug}/feed/like`;

    this.setState(
      {
        sendingLike: true,
      },
      () => {
        axios
          .post(
            url,
            {
              feed_id: id,
            },
            {
              headers: {
                Authorization: `Bearer ${user.api_token}`,
              },
            }
          )
          .then((res) => {
            if (res.data) {
              this.setState(res.data);
            }
          })
          .catch((error) => {
            // console.error('post feed like error', error);
          })
          .then(() => {
            this.setState({ sendingLike: false });
          });
      }
    );
  };

  iniEditableDiv = () => {
    const { feedIndex } = this.props;
    const editableDiv = document.getElementById(
      `text-area-editable-${feedIndex}`
    );
    const removeImg = () => {
      const br = editableDiv.getElementsByTagName("img");
      for (let i = 0; i < br.length; i++) {
        br[i].parentNode.removeChild(br[i]);
      }
    };
    if (editableDiv) {
      this.setState(
        {
          mentionsLoaded: true,
        },
        () => {
          editableDiv.addEventListener("paste", (e) => {
            e.preventDefault();
            const text = (e.originalEvent || e).clipboardData.getData(
              "text/plain"
            );
            window.document.execCommand("insertText", false, text);
          });
          editableDiv.addEventListener("input", (e) => {
            removeImg();
            this.onInputComment(e);
          });
          editableDiv.addEventListener("click", () => {
            removeImg();
          });
          editableDiv.addEventListener("keydown", (e) => {
            const { key } = event;
            const sel = window.getSelection();
            const range = sel.getRangeAt(0);
            if (key === "Backspace" || key === "Delete") {
              if (range) {
                const { startContainer } = range;
                const { parentNode } = startContainer;
                if (parentNode.tagName === "SPAN") {
                  parentNode.parentNode.removeChild(parentNode);
                }
              }
            }
          });
          editableDiv.addEventListener("blur", () => {
            // timeout needed or else the click event when actually mentioning
            // someone will not be triggered
            setTimeout(() => {
              this.toggleUserMentions(false);
            }, 200);
          });
        }
      );
    }
  };

  iniClickEventListener = () => {
    const { feedIndex } = this.props;
    const userMentionDom = document.getElementById(`userMention-${feedIndex}`);

    // for user mentions
    if (userMentionDom) {
      userMentionDom.addEventListener("click", (e) => {
        const { target } = e;
        let { value } = target;
        value = !value ? target.getAttribute("value") : value;
        const fullName = target.getAttribute("name");

        const { toSearchMention } = this.state;

        if (fullName && fullName !== "") {
          const sel = window.getSelection();
          const range = sel.getRangeAt(0);
          const { startContainer } = range;
          const html = `<span contentEditable="false" class="mentioned-span" name="${value}" style="cursor:pointer; color:#265fd0">@${fullName}</span>&#32 &#8203;`;
          helper.pasteHtmlAtCaret(html, false);
          this.toggleUserMentions(false);
          if (startContainer.nodeValue.includes("@")) {
            startContainer.nodeValue = startContainer.nodeValue.replace(
              `@${toSearchMention}`,
              ""
            );
          } else if (startContainer.nodeValue.includes("＠")) {
            startContainer.nodeValue = startContainer.nodeValue.replace(
              `＠${toSearchMention}`,
              ""
            );
          }
          // const html = isMobile ? `<span contentEditable="false" class="mentioned-span" name="${value}" style="cursor:pointer; color:#265fd0">@${fullName}</span>&#32 &#8203;` :
          this.onInputComment(
            document.querySelector(`#text-area-editable-${feedIndex}`)
          );
        }
      });
    }
  };

  mentionListener = () => {
    const sel = window.getSelection();
    if (sel) {
      // get current range based on caret location
      const range = sel.getRangeAt(0);
      const { endContainer, endOffset } = range;
      const { nodeValue } = endContainer;

      const indices = [];

      if (nodeValue) {
        const halfWidthFound = nodeValue.includes("@");
        const fullWidthFound = nodeValue.includes("＠");

        if (fullWidthFound || halfWidthFound) {
          const element = fullWidthFound ? "＠" : "@";
          let idx = nodeValue.indexOf(element);
          while (idx !== -1) {
            indices.push(idx);
            idx = nodeValue.indexOf(element, idx + 1);
          }

          let indexOfClosetCaret = 0;
          if (indices.length === 1) {
            indexOfClosetCaret = indices[0];
          } else {
            indices.forEach((pos, index) => {
              if (!indices[index + 1] && endOffset > pos) {
                indexOfClosetCaret = pos;
              } else if (endOffset > pos && endOffset < indices[index + 1]) {
                indexOfClosetCaret = pos;
              }
            });
          }
          let arrangedString = "";

          // get start and end index from @ up until the next space
          // then rearrange back string
          // then setstate user to search based on string after @
          for (let i = indexOfClosetCaret; i <= endOffset - 1; i++) {
            const nodeString = nodeValue.charAt(i);
            if (nodeString && nodeString !== " ") {
              arrangedString += nodeString;
            } else {
              i = 10000; // cancel the loop
              arrangedString = "";
            }
          }

          const toMention = arrangedString.replace(element, "");
          const { toSearchMention } = this.state;
          if (toMention === toSearchMention) {
            // this.toggleUserMentions(false);
          } else {
            this.setState(
              {
                toSearchMention: toMention,
              },
              () => {
                if (toMention !== "" && toMention !== element) {
                  this.toggleUserMentions(true);
                } else {
                  this.toggleUserMentions(false);
                }
              }
            );
          }

          // to keep for debugging purposes;
          // eslint-disable-next-line no-unused-vars
          const carretValue = nodeValue.charAt(endOffset - 1);
          if (carretValue === element) {
            this.toggleUserMentions(true);
          } else if (!nodeValue.includes(element)) {
            this.toggleUserMentions(false);
          }

          if (carretValue.replace(/\s/g, "") === "") {
            this.toggleUserMentions(false);
          }

          // value the -1 index of carret value
          // eslint-disable-next-line no-unused-vars
          const prevCaretValue = nodeValue.charAt(endOffset - 2);
        } else {
          this.toggleUserMentions(false);
        }
      } else {
        this.toggleUserMentions(false);
      }
    }
  };

  toggleUserMentions = (bool = null) => {
    let { showUserMention: show } = this.state;
    this.setState({
      showUserMention: bool !== null ? bool : !show,
    });
  };

  viewProfile = (alumniInfo) => {
    const { activeCompany, history, onClickSeeProfile } = this.props;

    if (alumniInfo.type == "alumni" || alumniInfo.type == "employee") {
      onClickSeeProfile(alumniInfo);
    } else {
      helper.fetchAdminThread(activeCompany.slug, history);
    }
  };

  moveToProfile = (event) => {
    const {
      activeCompany,
      feedable,
      history,
      user,
      user_id,
      post_type: postType,
    } = this.props;
    // do not allow view admin profile
    if (!user_id) {
      if (feedable && !["event", "poll"].includes(postType)) {
        history.push(`/message/${feedable.slug}`);
      } else if (
        this.props.alumni.full_name != "DELETED USER" &&
        this.props.alumni.full_name != "DISABLED USER"
      ) {
        GA.event(CATEGORY_FEED, ACTION_FEED_VIEW_PROFILE);
        event.preventDefault();
        this.props.onClickSeeProfile(this.props.alumni);
      }
    } else {
      helper.fetchAdminThread(activeCompany.slug, history);
    }
  };

  showLikes = (type = null) => {
    const {
      activeCompany: { slug: companySlug },
      id: feedId,
      onClickShowLikes,
    } = this.props;

    axios
      .get(`/api/alumni/${companySlug}/feed/likes`, {
        params: { feed_id: feedId },
      })
      .then(({ data: likes }) => {
        onClickShowLikes(likes, type);
      });
  };

  handleFollow = () => {
    const { activeCompany, feedable, history } = this.props;
    const data = {
      chatSlug: feedable.slug,
    };

    if (feedable.following) {
      history.push(`/message/${feedable.slug}`);
    } else {
      this.setState({
        loading: true,
      });
      axios
        .post(`/api/alumni/${activeCompany.slug}/groupChats/request`, data)
        .then((res) => {
          history.push(`/message/${feedable.slug}`);
        });
    }
  };

  // https://stackoverflow.com/questions/487073/how-to-check-if-element-is-visible-after-scrolling?rq=1
  isScrolledIntoView = () => {
    const elem = document.querySelector(`#feed-${this.props.feedIndex}`);
    const docViewTop = $(window).scrollTop();
    const docViewBottom = docViewTop + $(window).height();

    const elemTop = $(elem).offset().top;
    const elemBottom = elemTop + $(elem).height();

    const isOnScreen = elemBottom <= docViewBottom && elemTop >= docViewTop;
    this.setState({
      isOnScreen,
    });
  };

  toggleInterested = () => {
    const {
      user,
      activeCompany,
      id: feedId,
      alumni,
      fromPostList,
      post_title,
      translations: { _props: trans },
    } = this.props;
    const { interested } = this.state;
    let alCom;
    let alumSlug;
    let langToUse = "jp";

    if (alumni && alumni.alumni_company) {
      alCom = alumni.alumni_company[0];
    }

    if (alumni) {
      alumSlug = alumni.slug || alCom.slug;
      langToUse = alumni.preferred_language;
    }

    let content = !interested
      ? trans[langToUse].post_to_interest_message
      : trans[langToUse].post_to_retract_message;

    this.setState(
      {
        interested: !interested,
        interestedLoading: true,
      },
      () => {
        axios
          .post(`/api/alumni/${activeCompany.slug}/post/interested`, {
            feedId,
          })
          .then((res) => {
            const {
              creator_type: threadCType,
              creator_id: threadCId,
              id: threadId,
              slug: threadSlug,
            } = res.data;
            const toSend = {
              creator_id: user.id,
              creator_type: "App\\Alumni",
              content,
              recipient_id: alumSlug || threadCId,
              recipient_type: alumni ? "App\\Alumni" : threadCType,
              isPostMessage: true,
              feedId,
            };
            if (alumni) {
              toSend.type = "direct_message";
            } else {
              toSend.threadId = threadId;
            }

            axios.post("/api/alumni/messages", toSend).then(() => {
              const messageUrl = alumni
                ? `/direct-message/${activeCompany.slug}/${alumSlug}/${alumni.current_type}`
                : `/messages/${activeCompany.slug}/${threadSlug}`;
              this.setState({
                messageUrl,
                interestedLoading: false,
                showPostModal: "interested",
              });
            });
          });
      }
    );
  };

  toggleBookMark = () => {
    const {
      user,
      activeCompany,
      id: feedId,
      translations,
      handleDispatchToast,
    } = this.props;
    const { bookmarked } = this.state;

    this.setState(
      {
        bookmarked: !bookmarked,
        loadingBookmark: true,
      },
      () => {
        const { bookmarked: updatedBookmark } = this.state;
        const {
          new_bosyu_add_bookmark:
            addedBookmarkText = "あとで見るに追加しました",
          new_bosyu_bookmark_updates:
            addedBookmarkDescText = "「あとで見る」に追加した投稿はMyプロフィールからいつでも更新を確認できます。",
          new_bosyu_remove_bookmarks:
            removedBookmarkText = "あとで見るから削除しました",
        } = translations;

        const bookmarkedText = updatedBookmark
          ? addedBookmarkText
          : removedBookmarkText;
        const bookmarkedDescText = updatedBookmark
          ? addedBookmarkDescText
          : null;
        axios
          .post(`/api/alumni/${activeCompany.slug}/post/bookmark`, {
            feedId,
          })
          .then(() => {
            handleDispatchToast(bookmarkedText, bookmarkedDescText);
          });
      }
    );
  };

  togglePostModal = (showPostModal = null) => {
    const { showPostModal: currentPostModalType } = this.state;

    this.setState(
      {
        showPostModal,
      },
      () => {
        const { handleClearData, sourceComponent } = this.props;
        const { interested, bookmarked } = this.state;
        if (
          (!interested || !bookmarked) &&
          showPostModal === null &&
          sourceComponent === "PostsList"
        ) {
          if (
            (!interested && currentPostModalType === "interested") ||
            (!bookmarked && currentPostModalType === "bookmark")
          ) {
            handleClearData(currentPostModalType);
          }

          if (
            this.props.interested !== interested ||
            this.props.bookmark !== bookmarked
          ) {
            this.setState({
              interested: this.props.interested,
              bookmarked: this.props.bookmark,
            });
          }
        }
      }
    );
  };

  searchTag = (tagName = "") => {
    const {
      activeCompany: { subtypes = {} },
      history,
      user,
    } = this.props;
    const include =
      Object.keys(subtypes).length > 0 ? Object.keys(subtypes) : [];

    if (user.current_type && tagName !== "") {
      history.push({
        pathname: "/directories/search/results",
        state: {
          searches: {
            endDate: "0000",
            jobCategories: [],
            keywords: tagName,
            startDate: "0000",
            ...(include.length > 0 && {
              include,
            }),
          },
          useBrowserBack: true,
        },
      });
    }
  };

  renderAlumniTags = () => {
    let { feed_contents: feedContents } = this.props;
    feedContents = feedContents.split("\n");

    if (feedContents.length === 3) {
      const tagNames = feedContents[1].split("、");
      const tagNamesClickable = [];
      tagNames.forEach((tagName, index) => {
        tagNamesClickable.push(
          <span
            onClick={() => this.searchTag(tagName.replace("#", ""))}
            style={{
              cursor: "pointer",
            }}
          >
            {tagName}
          </span>
        );
        if (index < tagNames.length - 1) {
          tagNamesClickable.push(<span>{"、"}</span>);
        }
      });

      return (
        <p>
          {`${feedContents[0]}\n`}
          {
            <span
              style={{
                color: "#2D8CF8",
                fontWeight: "bold",
              }}
            >
              {tagNamesClickable.map((item) => item)}
            </span>
          }
          {`\n${feedContents[2]}`}
        </p>
      );
    } else {
      return feedContents.join("\n");
    }
  };

  renderFeedContent = (feedContent, index, entireText) => {
    // check if feedcontent has url, unsure if this is the most optimal given the BRs set
    const urlRegex =
      /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{1,24}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/g;
    const fromText = entireText.split(" ")[index];
    if (urlRegex.test(fromText)) {
      const randomizedIdentifier = Math.random().toString(36).slice(2);
      // find the url part and replace to anchor. add a unique identifier to be used to explode later on
      let urlIndex = 0;
      const link = feedContent.replaceAll(urlRegex, function (url) {
        const unshortenedUrl = url.endsWith("...")
          ? fromText.match(urlRegex)[urlIndex]
          : url;
        const prefix =
          url.includes("http://") || url.includes("https://") ? "" : "//";
        // check to split \n because {text}\n\{url}\n{text} is considered a link
        const explodeNl = url.split("\n");
        const newFeedContent = explodeNl.filter((n) => {
          return urlRegex.test(n);
        })[0];
        // if explodedNl returns null, render feedContent
        urlIndex++;
        return `${randomizedIdentifier}<a href="${prefix + unshortenedUrl}" target="_blank" >${newFeedContent ?? url} </a> ${randomizedIdentifier}`;
      });

      const exploded = link.split(randomizedIdentifier);
      return (
        <span>
          {exploded.map((e) => {
            if (e.includes("<a href=") && e.includes("</a>")) {
              return <span dangerouslySetInnerHTML={{ __html: e }} />;
            }
            if ((e.includes("http") || e.includes("//")) && e.endsWith("...")) {
              return null;
            }
            return e;
          })}
        </span>
      );
    }
    return feedContent + " ";
  };
  renderOtherPostTypes = (feed_type) => {
    if (feed_type === "add_tag") {
      return this.renderAlumniTags();
    } else if (feed_type === "content") {
      return this.renderContentPost();
    }
    return <p>{this.props.feed_contents}</p>;
  };

  renderContentPost = () => {
    const { imageWidth, isMobile } = this.state;
    const {
      fromPostList,
      post_title,
      post_type,
      alumni,
      status: feedStatus,
      translations,
      slug,
      content_type,
      tags,
    } = this.props;

    let {
      feed_contents: feedContents,
      post_type: postType,
      render,
    } = this.props;
    const feedRender = JSON.parse(render);
    let wordLimit = isMobile ? 35 : 100;
    const { hide } = this.state;
    const indicesNewLines = [];
    const regEx = /\n/gm;
    let current;
    let showReadMore = false;
    const content = this.props.content ?? {};
    let ignoreShorten = false;
    feedContents = feedContents.replace(/&nbsp;/g, " ").trimEnd();
    const entireText = feedContents;
    const host = window.location.origin;
    const url = `${host}/page/contents/${content.type}/${content.slug}`;
    const hasRender = feedRender && (feedRender.user_image || feedRender.image);
    // need dis because CSS of inline "read more" to "..." of content not possible with just css
    if (!hide) {
      while ((current = regEx.exec(feedContents)) != null) {
        indicesNewLines.push(current.index);
      }

      // check new line indices
      // wanna avoid more than 2 lines
      if (indicesNewLines.length > 1) {
        const [first, second] = indicesNewLines;
        if (second && second < wordLimit) {
          feedContents = `${feedContents.slice(0, second)}...`;
          showReadMore = true;
          ignoreShorten = true;
        }
      }

      // need this so that it doesn't cut it too shor. so if the remaining next is just 1/3 of the wordlimit
      // no need to cut since it's not that extra long anyway
      const remainingCharCount = feedContents.length - wordLimit;
      // if not shortened already by, do dis
      if (
        !ignoreShorten &&
        ((isMobile && feedContents.length > 35) ||
          (!isMobile && feedContents.length > 100)) &&
        remainingCharCount > wordLimit / 3
      ) {
        // computer for # of chars per width to maximize space
        wordLimit = this.feedContainer
          ? Math.ceil((this.feedContainer.clientWidth / 16) * 2) - 9
          : wordLimit; //wordlimit is the either 35 or 100 one
        feedContents = `${feedContents.slice(0, wordLimit)}...`;
        showReadMore = true;
      }
    }
    const exploded = feedContents.split(" ");
    return (
      <div className="feed_item_post_content">
        <div className={`feed_item_post_labels ${post_type}`}>
          <div className="feed_item_border-pars">
            {!feedStatus && (
              <p className="feed_item__status">
                {translations.unpublished_post || "非公開中"}
              </p>
            )}
            {tags &&
              tags.map((t) => <p className="feed_item__type">{t.name}</p>)}
          </div>
        </div>
        {hasRender && (
          <>
            <div
              className={`post_banner ${
                feedRender.type === "ogp" ? "pointer" : ""
              }`}
            >
              <div
                className="post_banner_container"
                style={{ maxWidth: imageWidth }}
              >
                {(feedRender.user_image || feedRender.image) && (
                  <img
                    src={feedRender.user_image || feedRender.image}
                    onLoad={(e) =>
                      this.setState({ imageWidth: e.target.clientWidth })
                    }
                    className={feedRender.type}
                  />
                )}
                {feedRender.type === "ogp" && (
                  <div className="post_banner_container_strings">
                    <h4>{feedRender.description}</h4>
                    <p>{feedRender.link}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        <div className="post_content">
          <span className="post_text">
            {exploded.map((e, index) =>
              this.renderFeedContent(e, index, entireText)
            )}
          </span>
          {content.type === "article" && (
            <span
              className="post_seeMore"
              onClick={() => {
                window.open(url, "_blank");
              }}
            >
              {translations.bosyu_read_more}
            </span>
          )}
        </div>
        {content.type === "survey" && (
          <div className="post_survey_container">
            <span
              onClick={() => {
                window.open(url, "_blank");
              }}
              className="post_survey_container_text"
            >
              {translations.post_content__answer_survey}
            </span>
          </div>
        )}
      </div>
    );
  };

  renderPost = (renderFeedProfile) => {
    const { imageWidth, like_count, liked, isMobile, bookmarked } = this.state;
    const {
      activeCompany,
      alumni_id,
      fromPostList,
      history,
      post_title,
      post_type,
      alumni,
      id: feedId,
      status: feedStatus,
      onClickShowLikes,
      interested: interstedProps,
      is_participating: isParticipating,
      user,
      translations,
      toggleImageModal,
      tags,
      onClickSeeProfile,
    } = this.props;
    let {
      feed_contents: feedContents,
      post_type: postType,
      render,
      created_at: feedCreatedAt,
      feedable,
      alumni: alumniOwner,
      user: userOwner,
      user_id,
    } = this.props;
    let owner = {};
    if (user_id) {
      owner = userOwner;
    } else {
      owner = alumniOwner;
    }

    const feedRender = JSON.parse(render);
    const isGhostUser = helper.checkIfIsGhostUser(user, activeCompany);
    const isLikedFeed = !!liked;
    let wordLimit = isMobile ? 75 : 300;
    const { hide } = this.state;
    const indicesNewLines = [];
    const regEx = /\n/gm;
    const isOwn = alumni_id === this.props.user.id;
    let current;
    let showReadMore = false;
    let backgroundImg = "/images/bosyu/bosyu_others.jpeg";
    let ignoreShorten = false;
    feedContents = feedContents ? feedContents.trimEnd() : "";
    postType = getCategoryText(translations, postType);

    const entireText = feedContents;
    // need dis because CSS of inline "read more" to "..." of content not possible with just css
    if (!hide) {
      while ((current = regEx.exec(feedContents)) != null) {
        indicesNewLines.push(current.index);
      }

      // check new line indices
      // wanna avoid more than 2 lines
      if (indicesNewLines.length > 1) {
        const [first, second] = indicesNewLines;
        if (second && second < wordLimit) {
          feedContents = `${feedContents.slice(0, second)}...`;
          showReadMore = true;
          ignoreShorten = true;
        }
      } else if (feedContents.length > wordLimit) {
        // old code only splits if there is a new line manually added
        feedContents = `${feedContents.slice(0, wordLimit)}...`;
        showReadMore = true;
        ignoreShorten = true;
      }

      // need this so that it doesn't cut it too shor. so if the remaining next is just 1/3 of the wordlimit
      // no need to cut since it's not that extra long anyway
      const remainingCharCount = feedContents.length - wordLimit;
      // if not shortened already by, do dis
      if (
        !ignoreShorten &&
        ((isMobile && feedContents.length > 35) ||
          (!isMobile && feedContents.length > 100)) &&
        remainingCharCount > wordLimit / 3
      ) {
        // computer for # of chars per width to maximize space
        wordLimit = this.feedContainer
          ? Math.ceil((this.feedContainer.clientWidth / 16) * 2) - 9
          : wordLimit; //wordlimit is the either 35 or 100 one
        feedContents = `${feedContents.slice(0, wordLimit)}...`;
        showReadMore = true;
      }
    }
    const exploded = feedContents.split(" ");

    const renderFeedableType = () => {
      switch (post_type) {
        case "event":
          return (
            <EventPost
              user={user}
              translations={translations}
              activeCompany={activeCompany}
              event={feedable}
              onClickSeeProfile={this.viewProfile}
              isOwn={isOwn}
            />
          );
        case "poll":
          return (
            <FeedPoll
              tags={tags}
              activeCompany={activeCompany}
              feedable={feedable}
              user={user}
              translations={translations}
              isOwn={isOwn}
            />
          );
        default:
          break;
      }
    };
    return (
      <div className="feed_item_post_content">
        <div className="post_content">
          <span className="post_text">
            {exploded.map((e, index) =>
              this.renderFeedContent(e, index, entireText)
            )}
          </span>
          {showReadMore && (
            <span
              className="post_seeMore"
              onClick={() => {
                this.setState({
                  hide: !hide,
                });
              }}
            >
              {translations.bosyu_read_more}
            </span>
          )}
        </div>
        {/* {
          (alumni && !fromPostList)
            &&
              <p className="post_preMessage">
                {translations.bosyu_posted_noted}
              </p>
        } */}
        {
          // user_image is the user uploaded image while image comes from ogp meta data
          feedRender && (feedRender.user_image || feedRender.image) && (
            <>
              <div
                className="post_banner pointer"
                onClick={() => {
                  if (feedRender.type === "ogp") {
                    window.open(feedRender.link, "_blank");
                  }
                }}
              >
                <div
                  className="post_banner_container"
                  style={{ maxWidth: imageWidth }}
                >
                  {(feedRender.user_image || feedRender.image) && (
                    <img
                      src={feedRender.user_image || feedRender.image}
                      onLoad={(e) =>
                        this.setState({ imageWidth: e.target.clientWidth })
                      }
                      onClick={() =>
                        feedRender.type === "image"
                          ? toggleImageModal(feedRender.user_image, true)
                          : {}
                      }
                      className={feedRender.type}
                    />
                  )}
                  {feedRender.type === "ogp" && (
                    <div className="post_banner_container_strings">
                      <h4>{feedRender.description}</h4>
                      <p>{feedRender.link}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )
        }
        {renderFeedableType()}
        <div className={`feed_item_post_labels ${post_type}`}>
          <div className="feed_item_border-pars">
            <p
              className="feed_item__type"
              data-cy="feed-tag--category"
              onClick={() =>
                history.push(`/feed/category/${post_type || "others"}`)
              }
            >
              {postType}
            </p>
            {tags &&
              tags.map((t) => (
                <p
                  className="feed_item__type"
                  data-cy="feed-tag--subcategories"
                  onClick={() =>
                    history.push({
                      pathname: `/feed/tag/${t.id}`,
                      state: {
                        tagName: t.name,
                      },
                    })
                  }
                >
                  {t.name}
                </p>
              ))}
            {!feedStatus && (
              <p className="feed_item__status">
                {translations.unpublished_post || "非公開中"}
              </p>
            )}
          </div>
        </div>
        {renderFeedProfile()}
        {!isOwn && (
          <div className="post_support">
            <p className="datetime">
              {helper.formatDateTimeByLocale(feedCreatedAt, "LLL")}
            </p>
            <a
              className={`feed_post_top feed_item_actions_like ${
                bookmarked ? "feed_item_action_active" : ""
              }`}
              onClick={
                !isGhostUser && feedStatus ? this.toggleBookMark : () => {}
              }
              style={{ cursor: !isGhostUser ? "pointer" : "default" }}
              tabIndex="0"
              role="button"
            >
              <img
                src={
                  bookmarked
                    ? "/images/icon_bookmark_green.svg"
                    : "/images/icon_bookmark.svg"
                }
                width="22"
              />
            </a>
          </div>
        )}
      </div>
    );
  };

  render() {
    const { liked } = this.state;
    const {
      activeCompany,
      alumni,
      alumni_company,
      alumni_id,
      created_at: feedCreatedAt,
      profileOptions,
      feedIndex,
      feed_type,
      feedable_type,
      feedable,
      fromPostList,
      history,
      id: feedId,
      post_title: postTitle,
      status: feedStatus,
      togglePostModal,
      translations,
      user,
      user_id,
      updated_at: feedUpdatedAt,
      post_type: postType,
      onClickSeeProfile,
    } = this.props;
    const isLikedFeed = !!liked;
    const {
      loading,
      showUserMention,
      toSearchMention,
      showCommentForm,
      bookmarked,
      interested,
      interestedLoading,
      loadingBookmark,
      messageUrl,
      comments,
      like_count,
    } = this.state;
    let profileImage;
    let className = "feed_item";
    const isOwn = alumni_id === this.props.user.id;

    const handleEdit = () => {
      GA.event(CATEGORY_FEED, ACTION_BOSYU_START_EDIT_BOSYU);
      const { post_type } = this.props;
      history.push({
        pathname: `/posts/edit/${feedId}`,
        state: {
          prevUrl: window.location.pathname,
          bosyuType: post_type,
        },
      });
    };

    if (
      !feedable ||
      ["EventPost", "PollPost"].some((x) => feedable_type.includes(x))
    ) {
      if (alumni && alumni.profile_image) {
        profileImage = this.props.alumni.profile_image;
      } else if (!alumni && alumni_id === null) {
        profileImage = activeCompany.logo;
      } else {
        profileImage = "/images/noimage.svg";
      }
    } else {
      if (feedable_type === "App\\GroupChat") {
        profileImage = feedable.icon;
      }
    }

    let fullName = this.props.alumni ? this.props.alumni.full_name : "company";
    let triggerMatching = true;

    if (!feedable) {
      if (fullName == "DISABLED USER") {
        fullName = translations.disabled_user || "利用休止中のユーザー";
        triggerMatching = false;
      } else if (fullName == "DELETED USER") {
        fullName = translations.deleted_user || "退会ユーザー";
        triggerMatching = false;
      }
    } else {
      if (feedable_type === "App\\GroupChat") {
        fullName = feedable.group_name;
      }
    }

    if (this.props.feed_type !== "answer_request_profile") {
      triggerMatching = false;
    }

    let isGhostUser = false;

    if (user.type === "alumni" && activeCompany) {
      isGhostUser = helper.checkIfIsGhostUser(
        this.props.user,
        this.props.activeCompany
      );
    }

    let match = false;
    let multipleCompanyMatch = false;
    let matchMessage = "";
    let viewedType = alumni ? this.props.alumni.current_type : "";
    let viewerType = this.props.user.current_type;
    let matchType = viewerType + "||" + viewedType;
    let matchTypeMsg = viewerType.charAt(0) + "to" + viewedType.charAt(0);
    let matchMade = "";

    const { first_liker: firstLike } = this.props;
    const ownFullName = user.full_name;
    let likeLabel = "";
    if (firstLike) {
      // another person liked
      const { full_name: likeFullName } = firstLike;
      likeLabel =
        like_count > 1
          ? translations.new_bosyu_post_likes
              .replace("{user_name}", likeFullName)
              .replace("{nn}", like_count - 1)
          : likeFullName;
    } else {
      likeLabel = ownFullName;
    }

    const renderCompanyName = () => {
      let toReturn;

      if (
        alumni &&
        (this.props.alumni.full_name == "DELETED USER" ||
          this.props.alumni.full_name == "DISABLED USER")
      ) {
        toReturn = "";
      } else {
        toReturn = showAlumniWorkInfo(this.props.alumni, " work-info");
      }

      return toReturn;
    };

    const renderAlumniDetails = () => {
      const { alumni, feed_type, translations } = this.props;
      const isActive = alumni.alumni_company[0].status === "ACTIVE";
      const language = translations._language || "jp";
      return (
        <div className={"feed_item_profile_texts"}>
          <div className={"feed_item_profile_text1"}>
            <p
              className={"feed_item_profile_name"}
              style={{
                color:
                  alumni.full_name == "DELETED USER" ||
                  alumni.full_name == "DISABLED USER"
                    ? "grey"
                    : "",
              }}
              onClick={this.moveToProfile}
            >
              {fullName}
            </p>
            {isActive &&
              language === "jp" &&
              feed_type !== "join_public_room" && (
                <p className="feed_item_profile_secondary">さん</p>
              )}
            <p style={{ marginLeft: "2px" }}>
              <UserTypeLabel
                user={alumni}
                stillShowInfoOnInactive
                styles={{
                  fontSize: 9,
                  fontWeight: 500,
                  padding: "3px 6px",
                  marginLeft: "2px",
                }}
              />
            </p>
          </div>
          {(feedable || this.props.alumni.current_occupation !== "") &&
            renderCompanyName()}
        </div>
      );
    };

    const renderOtherCommentsSection = () => {
      const uniqueCommenters = [];
      const ids = [];
      const { expandCommentSection } = this.state;
      for (let i = 0; i < comments.length; i++) {
        if (
          !ids.includes(comments[i].alumni_id) &&
          uniqueCommenters.length <= uniqueShown
        ) {
          uniqueCommenters.push(comments[i].alumni);
          ids.push(comments[i].alumni_id);
        }
        if (uniqueCommenters.length > uniqueShown + 1) {
          break;
        }
      }

      return (
        <div className="feed_item_comments">
          <FeedCommentExpand
            activeCompany={activeCompany}
            onClickSeeProfile={onClickSeeProfile}
            translations={translations}
            commenters={uniqueCommenters}
            commentCount={uniqueCommenters.length}
            toggleCommentSection={this.toggleCommentSection}
            expanded={expandCommentSection}
          />
        </div>
      );
    };
    const renderCommentSection = () => {
      const { expandCommentSection, comments } = this.state;
      const { status: feedStatus } = this.props;
      let commentInfo = "";
      const updateLikes = (index, op) => {
        if (comments[index]) {
          if (op) {
            comments[index].liked = true;
            comments[index].likes_count += 1;
          } else {
            comments[index].liked = false;
            comments[index].likes_count -= 1;
          }
        }
      };
      if (!expandCommentSection) {
        // render only one FeedComment
        commentInfo = NormalizeAlumniData2(
          this.props.activeCompany.id,
          comments[comments.length - 1]
        );
        return (
          <div className={"feed_item_comments"}>
            <FeedComment
              comment={commentInfo}
              activeCompany={this.props.activeCompany}
              user={this.props.user}
              isGhostUser={isGhostUser}
              onClickSeeProfile={this.props.onClickSeeProfile}
              likeUpdate={updateLikes}
              onClickShowLikes={this.props.onClickShowLikes}
              index={comments.length - 1}
              feedStatus={feedStatus}
            />
          </div>
        );
      }
      return (
        <div className={"feed_item_comments"}>
          {comments.map((comment, commentIndex) => {
            commentInfo = NormalizeAlumniData2(
              this.props.activeCompany.id,
              comment
            );
            return (
              <FeedComment
                comment={commentInfo}
                activeCompany={this.props.activeCompany}
                user={this.props.user}
                isGhostUser={isGhostUser}
                onClickSeeProfile={this.props.onClickSeeProfile}
                likeUpdate={updateLikes}
                onClickShowLikes={this.props.onClickShowLikes}
                index={commentIndex}
                feedStatus={feedStatus}
                key={commentIndex}
              />
            );
          })}
        </div>
      );
    };

    const renderCompanyDetails = () => {
      const content = this.props.content ?? {};
      let template = "";
      switch (content.type) {
        case "survey":
          template = translations.post_content__new_survey;
          break;
        case "article":
          template = translations.post_content__new_article;
          break;
        default:
          template = translations.bosyu_admin_post_name;
          break;
      }
      return (
        <div className={"feed_item_profile_texts"}>
          <div className={"feed_item_profile_text1"}>
            <p
              className={`feed_item_profile_name ${
                alumni_id === null ? "companyAdmin" : ""
              }`}
              data-flow
              style={{
                cursor: !alumni ? "default" : "",
              }}
            >
              {activeCompany
                ? template.replace("{team_name}", activeCompany.full_team_name)
                : ""}
            </p>
          </div>
        </div>
      );
    };

    const renderFeedProfile = () => {
      return (
        <div className={"feed_item_profile"}>
          <div className={"feed_item_profile_image_wrapper"}>
            <div
              className={"feed_item_profile_image"}
              onClick={this.moveToProfile}
              style={{
                backgroundImage: `url(${profileImage})`,
                borderRadius:
                  feedable && !["event", "poll"].includes(postType)
                    ? "0px"
                    : "",
                backgroundColor: "transparent",
              }}
            />
          </div>
          {alumni ? renderAlumniDetails() : renderCompanyDetails()}
        </div>
      );
    };
    const renderNotPublicRoom = () => {
      return (
        <div
          className={"feed_item_actions"}
          style={{
            display: alumni_id === this.props.user.id ? "" : "",
          }}
        >
          <div>
            <a
              className={`
                ${feed_type === "post" ? "feed_post" : ""}
                feed_item_actions_like
                ${isLikedFeed ? "feed_item_action_active" : ""}
              `}
              tabIndex="0"
              role="button"
              onClick={(e) => {
                if (!isGhostUser && feedStatus) {
                  this.toggleLike(e);
                }
              }}
              style={{ cursor: !isGhostUser ? "pointer" : "default" }}
            >
              <img
                src={
                  isLikedFeed ? "/images/like-active.png" : " /images/like.png"
                }
                width="22"
              />
              {translations.feed_like}
            </a>
          </div>
          {!["admin_post"].includes(postType) && (
            <div>
              <a
                className={`
                    ${feed_type === "post" ? "feed_post" : ""}
                    feed_item_actions_comment
                    ${showCommentForm ? "feed_item_action_active" : ""}
                  `}
                style={{ cursor: !isGhostUser ? "pointer" : "default" }}
                tabIndex="0"
                role="button"
                onClick={(e) => {
                  if (!isGhostUser && feedStatus) {
                    this.toggleCommentForm(e);
                  }
                }}
              >
                <img
                  src={
                    this.state.showCommentForm
                      ? "/images/comment-active.png"
                      : "/images/comment.png"
                  }
                  width="22"
                />
                {translations.feed_comment || "コメントする"}
              </a>
            </div>
          )}
        </div>
      );
    };

    let headerImage = "";

    switch (postType) {
      case "notices":
        headerImage = `/images/bosyu-redesign/image_post_announcement.svg`;
        break;
      case "jobs":
        headerImage = `/images/bosyu-redesign/image_post_recruit.svg`;
        break;
      default:
        headerImage = `/images/bosyu-redesign/image_post_${postType}.svg`;
        break;
    }
    return (
      <div
        className={`feed_item ${feedStatus ? "" : "disabled_feed"}`}
        data-cy={`feed-${this.props.feedIndex}`}
        id={`feed-${this.props.feedIndex}`}
      >
        <div className={`feed_item_header ${postType}`}>
          <p>
            {postTitle}
            <img src={headerImage} />
          </p>
          {isOwn && (
            <Button
              bsStyle="primary"
              onClick={() => handleEdit()}
              className="edit-post"
            >
              {translations.edit_button_text}
            </Button>
          )}
        </div>

        <div
          ref={(el) => (this.feedContainer = el)}
          className={"feed_item-message feed_nl2br"}
        >
          {this.renderPost(renderFeedProfile)}
        </div>

        {(!fromPostList || (fromPostList && !isOwn)) &&
          feed_type !== "post" &&
          renderFeedProfile()}
        {feed_type !== "post" && feed_type !== "content" && (
          <div className={"feed_item_create_date"}>
            {helper.formatDateTimeByLocale(this.props.created_at, "LLL")}
          </div>
        )}
        {match && (
          <div
            className="feed_item_message_match"
            data-cy={`match-click-profile-div-${this.props.feedIndex}`}
          >
            <IconMatch
              style={{
                width: 67,
                height: 40,
                color: "#FF7A7A",
                display: "block",
                margin: "0 auto 23px",
              }}
            />
            <button
              onClick={this.moveToProfile}
              className="btn-default btn text-center"
              data-cy={`fd-${matchTypeMsg}-${matchMade}__${this.props.feedIndex}`}
            >
              <p className="feed_nl2br">
                {matchMessage.replace(
                  "{alumni_or_employee_text}",
                  this.props.translations[
                    "room_" + this.props.alumni.current_type + "_label"
                  ]
                )}
              </p>
            </button>
          </div>
        )}

        <div
          className={`feed_item_message_footer ${
            feed_type === "content" && "content-footer"
          }`}
        >
          <div className={"feed_item_message_footer_icon like_icon"}>
            {this.state.like_count > 0 && (
              <div onClick={this.showLikes}>
                <img
                  src="/images/like-buttons/icon-like-before-click.svg"
                  width="18"
                />
                <span className={"feed_item_like_count"}>{likeLabel}</span>
              </div>
            )}
          </div>
          <div className="feed_item_message_footer_icon">
            {this.state.comments.length > 0 && (
              <div>
                <img src="/images/comment.svg" width="18" />
                <span className="feed_item_like_count">
                  {this.state.comments.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {feed_type !== "join_public_room" ? (
          renderNotPublicRoom()
        ) : (
          <div div className={"feed_item_actions join-room"}>
            <p
              style={{
                cursor: loading ? "no-drop" : "",
                color: loading ? "#d5dadf" : "",
              }}
              onClick={!loading ? this.handleFollow : () => {}}
            >
              {feedable.following
                ? translations.view_room || "トークルームを見る"
                : translations.follow_room || "トークルームに参加する"}
            </p>
          </div>
        )}
        <div
          className={
            "feed_item_comment_form " +
            (this.state.showCommentForm ? "feed_item_comment_form_show" : "")
          }
        >
          <div
            className={"feed_item_comment_profile_image"}
            style={{
              backgroundImage: `url(${
                this.props.user.profile_image || "/images/noimage.svg"
              })`,
              display: !showCommentForm ? "none" : "block",
            }}
          />
          <div
            className={"feed_item_comment_input_wrapper"}
            style={{
              display: !showCommentForm ? "none" : "block",
            }}
          >
            {showUserMention && (
              <UserMention
                toggleUserMentions={this.toggleUserMentions}
                toSearchMention={toSearchMention}
                sourceComponent="feed"
                show={showUserMention}
                {...this.props}
              />
            )}
            <div
              className="feed_item_comment_input"
              contentEditable="true"
              data-cy="feed-comment"
              id={`text-area-editable-${feedIndex}`}
            />
          </div>
          <div
            className={
              "feed_item_comment_button " +
              (!this.state.canSendComment || isGhostUser
                ? "feed_item_comment_button_disabled"
                : "")
            }
            style={{
              display: !showCommentForm ? "none" : "block",
            }}
          >
            <a onClick={!isGhostUser ? this.sendComment : () => {}}>
              {this.state.sendingComment ? (
                <i className="fa fa-circle-o-notch fa-spin" />
              ) : (
                translations.feed_comment_post_label
              )}
            </a>
          </div>
        </div>

        {this.state.comments.length > 0 && renderCommentSection()}
        {this.state.comments.length > 1 && renderOtherCommentsSection()}
        {this.state.showPostModal && (
          <PostModal
            user={this.props.user}
            history={history}
            show={this.state.showPostModal}
            toggleBookMark={this.toggleBookMark}
            toggleInterested={this.toggleInterested}
            toggle={this.togglePostModal}
            interestedLoading={interestedLoading}
            interested={interested}
            bookmarked={bookmarked}
            alumni={alumni}
            fromPostList={fromPostList}
            postTitle={postTitle}
            activeCompany={activeCompany}
            messageUrl={messageUrl}
            translations={translations}
          />
        )}
      </div>
    );
  }
}

export default FeedItemPost;
