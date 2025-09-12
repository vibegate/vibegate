#!/bin/bash

# 获取脚本所在目录的父目录（项目根目录）
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 创建软链接的函数
create_env_symlink() {
    local app_dir="$1"
    local env_file="$ROOT_DIR/.env"
    local target_link="$app_dir/.env"
    
    # 如果目标目录不存在，跳过
    if [ ! -d "$app_dir" ]; then
        echo "目录不存在: $app_dir"
        return
    fi
    
    # 如果已经存在软链接，先删除
    if [ -L "$target_link" ]; then
        rm "$target_link"
    fi
    
    # 创建软链接
    ln -s "$env_file" "$target_link"
    echo "创建软链接: $target_link -> $env_file"
}

# 确保.env文件存在
if [ ! -f "$ROOT_DIR/.env" ]; then
    if [ -f "$ROOT_DIR/.env.example" ]; then
        cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
        echo "从.env.example创建了新的.env文件"
    else
        echo "错误：未找到.env.example文件"
        exit 1
    fi
fi

# 为apps目录下的所有项目创建软链接
for app_dir in "$ROOT_DIR/apps"/*; do
    if [ -d "$app_dir" ]; then
        create_env_symlink "$app_dir"
    fi
done

echo "环境变量软链接设置完成！"
