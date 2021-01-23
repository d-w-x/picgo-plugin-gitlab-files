import {IImgInfo} from "picgo/dist/src/types";
import {formatPath, formatMessage} from "./pathUtils";

/**
 * 使用 Gitlab Api 获取项目的信息
 */
export function getProjectInfo(userConfig: GitlabFilesLoaderUserConfig) {
    let url: string
    if (userConfig.gitUrl.endsWith("/")) {
        url = userConfig.gitUrl + "api/v4/projects/" + userConfig.projectId
    } else {
        url = userConfig.gitUrl + "/api/v4/projects/" + userConfig.projectId
    }

    return {
        method: 'GET',
        url: url,
        headers: {
            'PRIVATE-TOKEN': userConfig.gitToken,
            Date: new Date().toUTCString(),
        }
    }
}

/**
 * 使用 Gitlab Api 向服务器进行一次单文件提交
 */
export function postSingleFile(userConfig: GitlabFilesLoaderUserConfig, filePath, commitMessage, base64Image: string) {
    let url: string
    if (userConfig.gitUrl.endsWith("/")) {
        url = userConfig.gitUrl + "api/v4/projects/" + userConfig.projectId + "/repository/files/" + filePath;
    } else {
        url = userConfig.gitUrl + "/api/v4/projects/" + userConfig.projectId + "/repository/files/" + filePath;
    }

    return {
        method: 'POST',
        url: url,
        headers: {
            'PRIVATE-TOKEN': userConfig.gitToken,
            Date: new Date().toUTCString(),
            'Content-Type': 'application/json',
            'User-Agent': 'PicGo'
        },
        body: {
            branch: userConfig.branch,
            author_email: userConfig.authorMail,
            author_name: userConfig.authorName,
            encoding: "base64",
            commit_message: commitMessage,
            content: base64Image
        },
        json: true
    }
}


/**
 * 使用 Gitlab Api 向服务器进行一次多文件提交
 */
export function postMultiFiles(userConfig: GitlabFilesLoaderUserConfig, outputs: IImgInfo[]) {
    let url: string
    if (userConfig.gitUrl.endsWith("/")) {
        url = userConfig.gitUrl + "api/v4/projects/" + userConfig.projectId + "/repository/commits"
    } else {
        url = userConfig.gitUrl + "/api/v4/projects/" + userConfig.projectId + "/repository/commits"
    }

    outputs.forEach(output => {
        output['newPath'] = formatPath(output, userConfig.fileName, false)
    })

    let actions = outputs.map(output => {
        if (!output.base64Image) {
            output.base64Image = output.buffer.toString('base64')
            delete output.buffer
        }
        return {
            action: 'create',
            file_path: output.newPath,
            encoding: 'base64',
            content: output.base64Image,
        }
    })

    return {
        method: 'POST',
        url: url,
        headers: {
            'PRIVATE-TOKEN': userConfig.gitToken,
            Date: new Date().toUTCString(),
            'Content-Type': 'application/json',
            'User-Agent': 'PicGo'
        },
        body: {
            id: userConfig.projectId,
            branch: userConfig.branch,
            commit_message: formatMessage(userConfig.commitMessage, `"${outputs/*.slice(0, 3)*/.map(output => output.fileName).join('" & "')}"`),
            author_email: userConfig.authorMail,
            author_name: userConfig.authorName,
            actions: actions
        },
        json: true
    }
}