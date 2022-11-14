import {IFullResponse} from 'picgo'
import {IPicGo, IPluginConfig, IOldReqOptionsWithFullResponse} from 'picgo'
import {
    getProjectInfo,
    removeMultiFiles,
    removeSingleFile,
    uploadMultiFiles,
    uploadSingleFile
} from "./utils/gitlabApiCall";
import {formatMessage, formatPath, replaceSlash} from "./utils/pathUtils";

const UPLOADER = 'gitlab-files-uploader'

export = (ctx: IPicGo) => {
    const defaultConfig = {
        gitUrl: 'https://gitlab.com',
        projectId: 0,
        branch: 'master',
        gitToken: '',
        gitVersionUnderThirteen: false,
        fileName: '/pictures/{year}/{month}/{day}_{hour}_{minute}_{second}_{fileName}',
        commitMessage: 'Upload {fileName} By PicGo gitlab files uploader at {year}-{month}-{day}',
        deleteRemote: false,
        deleteMessage: "Delete {fileName} By PicGo gitlab files uploader at {year}-{month}-{day}",
        deleteInform: false,
        authorMail: '',
        authorName: ''
    }

    const config = (ctx: IPicGo) => {
        let userConfig = ctx.getConfig<GitlabFilesLoaderUserConfig>('picBed.gitlab-files-uploader')
        if (!userConfig) {
            userConfig = defaultConfig
        }

        const pluginConfig: IPluginConfig[] = [
            {
                name: 'gitUrl',
                type: 'input',
                required: true,
                default: userConfig.gitUrl,
                alias: 'gitlab 服务器地址',
                message: 'Server of Gitlab',
            },
            {
                name: 'projectId',
                type: 'input',
                default: userConfig.projectId,
                required: true,
                message: 'project ID',
                alias: '项目 id，在项目设置页面查看'
            },
            {
                name: 'branch',
                type: 'input',
                default: userConfig.branch,
                required: true,
                message: 'upload branch,maybe "main" for some project',
                alias: '默认分支,注意可能为 main'
            },
            {
                name: 'gitToken',
                type: 'input',
                default: userConfig.gitToken,
                required: true,
                message: 'Token of Gitlab',
                alias: 'gitlab 的 token'
            },
            {
                name: 'gitVersionUnderThirteen',
                type: 'input',
                default: userConfig.gitVersionUnderThirteen,
                required: false,
                message: 'If version of self-hosted Gitlab under 13, input `true`',
                alias: '自托管的Gitlab版本是否低于 13.0'
            },
            {
                name: 'fileName',
                type: 'input',
                default: userConfig.fileName,
                required: false,
                message: 'upload file name and path',
                alias: '文件名及其路径'
            },
            {
                name: 'commitMessage',
                type: 'input',
                default: userConfig.commitMessage,
                required: false,
                message: 'Git Message when upload new file(s)',
                alias: '上传文件的Git Message'
            },
            {
                name: 'deleteRemote',
                type: 'input',
                default: userConfig.deleteRemote,
                required: false,
                message: 'delete remote when you delete locally',
                alias: '是否同步删除远程对象，默认 false'
            },
            {
                name: 'deleteMessage',
                type: 'input',
                default: userConfig.deleteMessage,
                required: false,
                message: 'Git Message when delete file(s)',
                alias: '删除文件的Git Message'
            },
            {
                name: 'deleteInform',
                type: 'input',
                default: userConfig.deleteInform,
                required: false,
                message: 'inform you when delete the remote file',
                alias: '删除远程图片后是否通知'
            },
            {
                name: 'authorMail',
                type: 'input',
                default: userConfig.authorMail,
                required: false,
                message: 'uploader mail',
                alias: '上传者的邮箱'
            },
            {
                name: 'authorName',
                type: 'input',
                default: userConfig.authorName,
                required: false,
                message: 'uploader name',
                alias: '上传者的用户名'
            }
        ]
        return pluginConfig
    }

    const formatConfig = (userConfig: GitlabFilesLoaderUserConfig) => {
        return {
            gitUrl: userConfig.gitUrl || 'https://gitlab.com',
            projectId: userConfig.projectId || 0,
            branch: userConfig.branch || 'master',
            gitToken: userConfig.gitToken || '',
            gitVersionUnderThirteen: userConfig.gitVersionUnderThirteen || false,
            fileName: userConfig.fileName || '/pictures/{year}/{month}/{day}_{hour}_{minute}_{second}_{fileName}',
            commitMessage: userConfig.commitMessage || 'Upload {fileName} By PicGo gitlab files uploader at {year}-{month}-{day}',
            deleteRemote: userConfig.deleteRemote || false,
            deleteMessage: userConfig.deleteMessage || "Delete {fileName} By PicGo gitlab files uploader at {year}-{month}-{day}",
            deleteInform: userConfig.deleteInform || false,
            authorMail: userConfig.authorMail || '',
            authorName: userConfig.authorName || ''
        }
    }

    /**
     * 上传核心方法
     */
    const handle = async (ctx: IPicGo) => {
        let userConfig: GitlabFilesLoaderUserConfig = ctx.getConfig<GitlabFilesLoaderUserConfig>('picBed.gitlab-files-uploader')
        if (!userConfig) {
            throw new Error("Can't find gitlab uploader config")
        }
        userConfig = formatConfig(userConfig)

        const imgList = ctx.output;
        imgList.forEach(img => {
            img['newPath'] = formatPath(img, userConfig.fileName, imgList.length === 1)
        })
        const options = getProjectInfo(userConfig);
        const resp: IFullResponse<{ web_url: string }, IOldReqOptionsWithFullResponse> = await ctx.request(options);
        if (resp.statusCode !== 200) {
            throw new Error('Get gitlab project info failed.')
        }

        let resultPath;
        if (userConfig.gitVersionUnderThirteen) {
            resultPath = resp.body.web_url + "/raw/"
        } else {
            resultPath = resp.body.web_url + "/-/raw/"
        }

        let uploadOptions
        if (imgList.length === 1) {
            let img = imgList[0];
            if (!img.base64Image) {
                img.base64Image = img.buffer.toString('base64')
                delete img.buffer
            }

            uploadOptions = uploadSingleFile(
                userConfig,
                replaceSlash(img.newPath),
                formatMessage(userConfig.commitMessage, img.fileName),
                img.base64Image
            );
        } else {
            uploadOptions = uploadMultiFiles(userConfig, imgList)
        }

        await ctx.request(uploadOptions).then(() => {
            imgList.forEach(img => {
                let imgUrl = `${resultPath + userConfig.branch}/${img.newPath}`
                delete img.base64Image
                img.url = imgUrl
                img.imgUrl = imgUrl
            })
        }).catch(err => {
            ctx.log.error('======Start Gitlab files Upload Error======')
            ctx.log.error(err)
            ctx.emit('notification', {
                title: 'gitlab 上传错误',
                body: '请检查配置是否正确,能否链接'
            })
            ctx.log.error('======End Gitlab files Error======')
        });

        return ctx
    }

    /**
     * 删除核心方法
     */
    const onRemove = async function (files: RemoveImageType[]) {
        let userConfig: GitlabFilesLoaderUserConfig = ctx.getConfig('picBed.gitlab-files-uploader')
        if (!userConfig) {
            throw new Error("Can't find uploader config")
        }
        userConfig = formatConfig(userConfig)

        const rms = files.filter(each => each.type === UPLOADER)
        if (rms.length === 0 || !userConfig.deleteRemote) {
            return
        }
        let fail = false

        let options
        if (rms.length === 1) {
            options = removeSingleFile(userConfig, replaceSlash(rms[0].newPath), formatMessage(userConfig.deleteMessage, rms[0].fileName));
        } else {
            options = removeMultiFiles(userConfig, rms)
        }

        await ctx.request(options).catch((err) => {
            ctx.log.error('======Start Gitlab files Delete Error======')
            ctx.log.error(err)
            ctx.log.error('======End Gitlab Delete Error======')
            fail = true
        });
        if (userConfig.deleteInform) {
            ctx.emit('notification', {
                title: '远程文件删除提示',
                body: fail ? `删除远程图片失败。` : '成功同步删除远程文件。'
            });
        }
    }

    const register = () => {
        ctx.helper.uploader.register(UPLOADER, {
            handle,
            config,
            name: 'gitlab files 图片上传'
        })
        ctx.on('remove', onRemove)
    }

    return {
        uploader: UPLOADER,
        register
    }
}
