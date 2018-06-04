import * as messages from './messages';

/**
 * The UserFilter object transforms user objects into objects suitable to be sent as JSON to
 * the server, hiding any private user attributes.
 *
 * @param {Object} the LaunchDarkly client configuration object
 **/
export default function UserFilter(config) {
  const filter = {};
  const allAttributesPrivate =
    config.allAttributesPrivate !== undefined ? config.allAttributesPrivate : config.all_attributes_private;
  const privateAttributeNames =
    (config.privateAttributeNames !== undefined ? config.privateAttributeNames : config.private_attribute_names) || [];
  const ignoreAttrs = { key: true, custom: true, anonymous: true };
  const allowedTopLevelAttrs = {
    key: true,
    secondary: true,
    ip: true,
    country: true,
    email: true,
    firstName: true,
    lastName: true,
    avatar: true,
    name: true,
    anonymous: true,
    custom: true,
  };

  if (config.all_attributes_private !== undefined) {
    console && console.warn && console.warn(messages.deprecated('all_attributes_private', 'allAttributesPrivate'));
  }
  if (config.private_attribute_names !== undefined) {
    console && console.warn && console.warn(messages.deprecated('private_attribute_names', 'privateAttributeNames'));
  }

  filter.filterUser = function(user) {
    if (!user) {
      return null;
    }
    const userPrivateAttrs = user.privateAttributeNames || [];

    const isPrivateAttr = function(name) {
      return (
        !ignoreAttrs[name] &&
        (allAttributesPrivate || userPrivateAttrs.indexOf(name) !== -1 || privateAttributeNames.indexOf(name) !== -1)
      );
    };
    const filterAttrs = function(props, isAttributeAllowed) {
      return Object.keys(props).reduce(
        (acc, name) => {
          const ret = acc;
          if (isAttributeAllowed(name)) {
            if (isPrivateAttr(name)) {
              // add to hidden list
              ret[1][name] = true;
            } else {
              ret[0][name] = props[name];
            }
          }
          return ret;
        },
        [{}, {}]
      );
    };
    const result = filterAttrs(user, key => allowedTopLevelAttrs[key]);
    const filteredProps = result[0];
    let removedAttrs = result[1];
    if (user.custom) {
      const customResult = filterAttrs(user.custom, () => true);
      filteredProps.custom = customResult[0];
      removedAttrs = { ...removedAttrs, ...customResult[1] };
    }
    const removedAttrNames = Object.keys(removedAttrs);
    if (removedAttrNames.length) {
      removedAttrNames.sort();
      filteredProps.privateAttrs = removedAttrNames;
    }
    return filteredProps;
  };
  return filter;
}
